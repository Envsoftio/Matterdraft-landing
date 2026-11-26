import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from 'node:crypto'
import type { Client } from '@libsql/client'
import { applicationFailure } from './application-error.ts'

type VaultIdentity = { accountId: string; userId: string; vaultId: string }
const attemptWindow = 15 * 60 * 1000
const attemptLimit = 8

function encryptionKey() {
  const secret = process.env.DESKTOP_VAULT_RECOVERY_ENCRYPTION_KEY
  if (!secret || !/^[0-9a-f]{64}$/i.test(secret)) applicationFailure(503)
  return Buffer.from(secret, 'hex')
}

function associatedData({ accountId, userId, vaultId }: VaultIdentity) {
  return Buffer.from(JSON.stringify(['matterdraft-vault-recovery-v1', accountId, userId, vaultId]))
}

function encrypt(identity: VaultIdentity, recoveryKey: string) {
  const nonce = randomBytes(12)
  const key = encryptionKey()
  try {
    const cipher = createCipheriv('aes-256-gcm', key, nonce)
    cipher.setAAD(associatedData(identity))
    const encrypted = Buffer.concat([cipher.update(recoveryKey, 'hex'), cipher.final()])
    return Buffer.concat([nonce, cipher.getAuthTag(), encrypted]).toString('base64url')
  } finally {
    key.fill(0)
  }
}

function decrypt(identity: VaultIdentity, value: string) {
  const key = encryptionKey()
  try {
    const bytes = Buffer.from(value, 'base64url')
    if (bytes.length !== 60) applicationFailure(503)
    const decipher = createDecipheriv('aes-256-gcm', key, bytes.subarray(0, 12))
    decipher.setAAD(associatedData(identity))
    decipher.setAuthTag(bytes.subarray(12, 28))
    return Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString('hex')
  } catch {
    applicationFailure(503)
  } finally {
    key.fill(0)
  }
}

export async function saveVaultRecoveryKey(
  db: Client,
  identity: VaultIdentity,
  recoveryKey: string,
) {
  const { accountId, userId, vaultId } = identity
  const ciphertext = encrypt(identity, recoveryKey)
  const inserted = await db.execute({
    sql: `INSERT INTO vault_recovery_key (account_id, user_id, vault_id, ciphertext, created_at)
      SELECT ?, ?, ?, ?, ? FROM account_membership WHERE account_id = ? AND user_id = ?
      ON CONFLICT(account_id, user_id, vault_id) DO NOTHING RETURNING vault_id`,
    args: [accountId, userId, vaultId, ciphertext, Date.now(), accountId, userId],
  })
  if (inserted.rows.length) return
  const existing = await findVaultRecoveryKey(db, identity)
  if (!existing) applicationFailure(403)
  if (decrypt(identity, existing) !== recoveryKey.toLowerCase()) applicationFailure(409)
}

async function findVaultRecoveryKey(db: Pick<Client, 'execute'>, identity: VaultIdentity) {
  const { accountId, userId, vaultId } = identity
  const { rows } = await db.execute({
    sql: `SELECT k.ciphertext FROM vault_recovery_key k
      JOIN account_membership m ON m.account_id = k.account_id AND m.user_id = k.user_id
      WHERE k.account_id = ? AND k.user_id = ? AND k.vault_id = ?`,
    args: [accountId, userId, vaultId],
  })
  return typeof rows[0]?.ciphertext === 'string' ? rows[0].ciphertext : null
}

export async function admitVaultRecoveryAttempt(db: Client, userId: string) {
  const now = Date.now()
  const cutoff = now - attemptWindow
  const { rows } = await db.execute({
    sql: `INSERT INTO vault_recovery_attempt (user_id, window_started_at, attempts) VALUES (?, ?, 1)
      ON CONFLICT(user_id) DO UPDATE SET
        attempts = CASE WHEN window_started_at <= ? THEN 1 ELSE attempts + 1 END,
        window_started_at = CASE WHEN window_started_at <= ? THEN excluded.window_started_at ELSE window_started_at END
      WHERE window_started_at <= ? OR attempts < ? RETURNING attempts`,
    args: [userId, now, cutoff, cutoff, cutoff, attemptLimit],
  })
  if (!rows.length) applicationFailure(429)
}

export async function recoverVaultKey(db: Client, identity: VaultIdentity) {
  const tx = await db.transaction('write')
  try {
    const ciphertext = await findVaultRecoveryKey(tx, identity)
    if (!ciphertext) applicationFailure(404)
    const recoveryKey = decrypt(identity, ciphertext)
    await tx.execute({
      sql: `INSERT INTO audit_event
        (id, account_id, actor_user_id, event_type, subject_type, subject_id, event_detail, created_at)
        VALUES (?, ?, ?, 'vault_recovery.key_released', 'vault', ?, '{}', ?)`,
      args: [randomUUID(), identity.accountId, identity.userId, identity.vaultId, Date.now()],
    })
    await tx.commit()
    return recoveryKey
  } finally {
    tx.close()
  }
}
