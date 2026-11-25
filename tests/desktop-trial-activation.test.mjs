import assert from 'node:assert/strict'
import { generateKeyPairSync, sign, verify } from 'node:crypto'
import test from 'node:test'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'
import {
  activateDesktopTrial,
  createTrialChallenge,
} from '../server/utils/desktop-trial-activation.ts'
import { trialDuration } from '../server/utils/licence-trials.ts'

function installation() {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519')
  return {
    key: publicKey.export({ type: 'spki', format: 'der' }).subarray(-32).toString('base64url'),
    proof: (nonce) =>
      sign(null, Buffer.from(`matterdraft-desktop-trial-proof-v1:${nonce}`), privateKey).toString(
        'base64url',
      ),
  }
}

test('desktop trial binds the original expiry to one installation and consumes each challenge', async (t) => {
  const signing = generateKeyPairSync('ed25519')
  const env = {
    DESKTOP_TRIAL_SIGNING_KEY_ID: 'test-key',
    DESKTOP_TRIAL_SIGNING_KEY: signing.privateKey.export({ format: 'pem', type: 'pkcs8' }),
    LICENCE_TRIALS_ENABLED: 'true',
  }
  for (const [key, value] of Object.entries(env)) {
    const previous = process.env[key]
    t.after(() =>
      previous === undefined ? delete process.env[key] : (process.env[key] = previous),
    )
    process.env[key] = value
  }
  const db = createClient({ url: 'file::memory:' })
  t.after(() => db.close())
  await migrate(drizzle(db), { migrationsFolder: './drizzle' })
  await db.batch(
    [
      "INSERT INTO user (id, email, name) VALUES ('owner', 'owner@example.test', 'Owner'), ('member', 'member@example.test', 'Member')",
      "INSERT INTO customer_account (id, name, account_type, created_at) VALUES ('new', 'New', 'organisation', 1), ('existing', 'Existing', 'organisation', 1)",
      "INSERT INTO account_membership (account_id, user_id, role, created_at) VALUES ('new', 'owner', 'owner', 1), ('existing', 'owner', 'owner', 1), ('new', 'member', 'member', 1)",
    ],
    'write',
  )
  const earlierExpiry = Date.now() + trialDuration / 2
  await db.execute({
    sql: "INSERT INTO licence_trial (account_id, started_by_user_id, started_at, expires_at) VALUES ('existing', 'owner', ?, ?)",
    args: [earlierExpiry - trialDuration, earlierExpiry],
  })
  const first = installation()
  const second = installation()
  const challenge = (account, device = first) =>
    createTrialChallenge(db, account, 'owner', device.key)
  const activate = (account, nonce, device = first) =>
    activateDesktopTrial(db, account, 'owner', nonce, device.proof(nonce))
  const permitNextChallenge = (account) =>
    db.execute({
      sql: 'UPDATE trial_challenge SET issued_at = issued_at - 1000 WHERE account_id = ?',
      args: [account],
    })

  await assert.rejects(createTrialChallenge(db, 'new', 'member', first.key), {
    code: 'ACCESS_DENIED',
  })
  const { nonce } = await challenge('new')
  await assert.rejects(challenge('new'), { code: 'RATE_LIMITED' })
  await assert.rejects(activate('new', nonce, second), { code: 'ACCESS_DENIED' })
  const active = await activate('new', nonce)
  assert.equal(active.status, 'active')
  assert.equal(active.expiresAt - active.serverTime, trialDuration)
  const [header, payload, signature] = active.grant.split('.')
  assert.ok(
    verify(
      null,
      Buffer.from(`${header}.${payload}`),
      signing.publicKey,
      Buffer.from(signature, 'base64url'),
    ),
  )
  const claims = JSON.parse(Buffer.from(payload, 'base64url'))
  assert.equal(claims.accountId, 'new')
  assert.equal(claims.installationKey, first.key)
  assert.equal(claims.expiresAt, active.expiresAt)
  await assert.rejects(activate('new', nonce), { code: 'ACCESS_DENIED' })

  await permitNextChallenge('new')
  assert.equal((await activate('new', (await challenge('new')).nonce)).expiresAt, active.expiresAt)
  await permitNextChallenge('new')
  assert.deepEqual(await activate('new', (await challenge('new', second)).nonce, second), {
    status: 'device_limit',
  })
  assert.equal(
    (await activate('existing', (await challenge('existing')).nonce)).expiresAt,
    earlierExpiry,
  )
  await permitNextChallenge('existing')
  await db.execute(
    "UPDATE licence_trial SET expires_at = started_at + 1 WHERE account_id = 'existing'",
  )
  assert.equal(
    (await activate('existing', (await challenge('existing')).nonce)).status,
    'trial_ended',
  )
})
