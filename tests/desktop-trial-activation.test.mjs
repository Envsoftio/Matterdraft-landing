import assert from 'node:assert/strict'
import { generateKeyPairSync, verify } from 'node:crypto'
import test from 'node:test'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { activateDesktopTrial } from '../server/utils/desktop-trial-activation.ts'
import { trialDuration } from '../server/utils/licence-trials.ts'

test('desktop trial preserves one expiry per account across activations', async (t) => {
  const signing = generateKeyPairSync('ed25519')
  const env = {
    DESKTOP_TRIAL_SIGNING_KEY_ID: 'DESKTOP_TRIAL_SIGNING_KEY',
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
  // Existing deployments need only the account trial schema.
  await db.execute('DROP TABLE trial_installation')
  await db.execute('DROP TABLE trial_challenge')
  const activate = (account) => activateDesktopTrial(db, account, 'owner')

  await assert.rejects(activateDesktopTrial(db, 'new', 'member'), {
    code: 'ACCESS_DENIED',
  })
  const active = await activate('new')
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
  assert.equal(claims.sub, 'owner')
  assert.equal(claims.version, 2)
  assert.equal(claims.installationKey, undefined)
  assert.equal(claims.expiresAt, active.expiresAt)
  assert.equal((await activate('new')).expiresAt, active.expiresAt)
  assert.equal((await activate('existing')).expiresAt, earlierExpiry)
  await db.execute(
    "UPDATE licence_trial SET expires_at = started_at + 1 WHERE account_id = 'existing'",
  )
  assert.equal((await activate('existing')).status, 'trial_ended')
})
