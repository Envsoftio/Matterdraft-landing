import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import test from 'node:test'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'
import {
  admitVaultRecoveryAttempt,
  recoverVaultKey,
  saveVaultRecoveryKey,
} from '../server/utils/vault-recovery.ts'

test('recovery encrypts keys, binds them to vault and membership, and audits release', async (t) => {
  const name = 'DESKTOP_VAULT_RECOVERY_ENCRYPTION_KEY'
  const original = process.env[name]
  const encryptionKey = randomBytes(32).toString('hex')
  process.env[name] = encryptionKey
  t.after(() => {
    if (original === undefined) delete process.env[name]
    else process.env[name] = original
  })
  const db = createClient({ url: 'file::memory:' })
  t.after(() => db.close())
  await migrate(drizzle(db), { migrationsFolder: './drizzle' })
  await db.batch(
    [
      "INSERT INTO user (id, email, name) VALUES ('advocate', 'user@example.test', 'Advocate'), ('colleague', 'colleague@example.test', 'Colleague')",
      "INSERT INTO customer_account (id, name, account_type, created_at) VALUES ('chamber', 'Chamber', 'organisation', 1)",
      "INSERT INTO account_membership (account_id, user_id, role, created_at) VALUES ('chamber', 'advocate', 'member', 1), ('chamber', 'colleague', 'owner', 1)",
    ],
    'write',
  )
  const identity = { accountId: 'chamber', userId: 'advocate', vaultId: '12'.repeat(32) }
  const otherVault = { ...identity, vaultId: '34'.repeat(32) }
  const recoveryKey = randomBytes(32).toString('hex')
  await saveVaultRecoveryKey(db, identity, recoveryKey)
  await saveVaultRecoveryKey(db, identity, recoveryKey)
  await assert.rejects(saveVaultRecoveryKey(db, identity, 'ac'.repeat(32)), { code: 'CONFLICT' })
  await assert.rejects(recoverVaultKey(db, otherVault), { code: 'NOT_FOUND' })
  await assert.rejects(recoverVaultKey(db, { ...identity, userId: 'colleague' }), {
    code: 'NOT_FOUND',
  })
  const records = await db.execute('SELECT ciphertext FROM vault_recovery_key')
  assert.equal(records.rows.length, 1)
  const ciphertext = records.rows[0].ciphertext
  assert.equal(Buffer.from(ciphertext, 'base64url').length, 60)
  assert.equal(
    Buffer.from(ciphertext, 'base64url').includes(Buffer.from(recoveryKey, 'hex')),
    false,
  )
  await db.execute({
    sql: 'INSERT INTO vault_recovery_key VALUES (?, ?, ?, ?, 1)',
    args: [otherVault.accountId, otherVault.userId, otherVault.vaultId, ciphertext],
  })
  await assert.rejects(recoverVaultKey(db, otherVault), { code: 'DEPENDENCY_UNAVAILABLE' })
  process.env[name] = randomBytes(32).toString('hex')
  await assert.rejects(recoverVaultKey(db, identity), { code: 'DEPENDENCY_UNAVAILABLE' })
  process.env[name] = encryptionKey
  assert.equal(await recoverVaultKey(db, identity), recoveryKey)
  const audit = await db.execute(
    "SELECT actor_user_id, subject_id, event_detail FROM audit_event WHERE event_type = 'vault_recovery.key_released'",
  )
  assert.equal(audit.rows.length, 1)
  assert.equal(audit.rows[0].actor_user_id, identity.userId)
  assert.equal(audit.rows[0].subject_id, identity.vaultId)
  assert.equal(audit.rows[0].event_detail, '{}')
  await db.execute("DELETE FROM account_membership WHERE user_id = 'advocate'")
  await assert.rejects(recoverVaultKey(db, identity), { code: 'NOT_FOUND' })
  await assert.rejects(saveVaultRecoveryKey(db, identity, recoveryKey), { code: 'ACCESS_DENIED' })

  for (let attempt = 0; attempt < 8; attempt++) await admitVaultRecoveryAttempt(db, 'advocate')
  await assert.rejects(admitVaultRecoveryAttempt(db, 'advocate'), { code: 'RATE_LIMITED' })
  await admitVaultRecoveryAttempt(db, 'colleague')
  await db.execute(
    "UPDATE vault_recovery_attempt SET window_started_at = 0 WHERE user_id = 'advocate'",
  )
  await admitVaultRecoveryAttempt(db, 'advocate')
})
