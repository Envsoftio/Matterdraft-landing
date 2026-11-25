import {
  createPrivateKey,
  createPublicKey,
  randomBytes,
  randomUUID,
  sign,
  verify,
} from 'node:crypto'
import type { Client } from '@libsql/client'
import { applicationFailure } from './application-error.ts'
import { licenceTrialsEnabled, trialDuration } from './licence-trials.ts'

const challengeLifetime = 5 * 60 * 1000
const ed25519SpkiPrefix = Buffer.from('302a300506032b6570032100', 'hex')

export function decodeTrialField(value: unknown, length: number) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value)) applicationFailure(422)
  const bytes = Buffer.from(value, 'base64url')
  if (bytes.length !== length || bytes.toString('base64url') !== value) applicationFailure(422)
  return bytes
}

function signingKey() {
  const keyId = process.env.DESKTOP_TRIAL_SIGNING_KEY_ID
  const pem = process.env.DESKTOP_TRIAL_SIGNING_KEY
  if (!keyId || !/^[A-Za-z0-9_-]{1,64}$/.test(keyId) || !pem) applicationFailure(503)
  try {
    const privateKey = createPrivateKey(pem)
    if (privateKey.asymmetricKeyType === 'ed25519') return { keyId, privateKey }
  } catch {
    // Report configuration failures without exposing key material.
  }
  applicationFailure(503)
}

export async function createTrialChallenge(
  db: Client,
  accountId: string,
  userId: string,
  publicKey: string,
) {
  signingKey()
  decodeTrialField(publicKey, 32)
  const now = Date.now()
  const expiresAt = now + challengeLifetime
  const nonce = randomBytes(32).toString('base64url')
  const result = await db.execute({
    sql: `INSERT INTO trial_challenge (account_id, user_id, public_key, nonce, issued_at, expires_at)
      SELECT ?, ?, ?, ?, ?, ? FROM account_membership
      WHERE account_id = ? AND user_id = ? AND role = 'owner'
      ON CONFLICT(account_id) DO UPDATE SET user_id = excluded.user_id,
        public_key = excluded.public_key, nonce = excluded.nonce, issued_at = excluded.issued_at,
        expires_at = excluded.expires_at, consumed_at = NULL
      WHERE trial_challenge.issued_at <= excluded.issued_at - 1000
      RETURNING nonce`,
    args: [accountId, userId, publicKey, nonce, now, expiresAt, accountId, userId],
  })
  if (!result.rows.length) {
    const membership = await db.execute({
      sql: "SELECT 1 FROM account_membership WHERE account_id = ? AND user_id = ? AND role = 'owner'",
      args: [accountId, userId],
    })
    applicationFailure(membership.rows.length ? 429 : 403)
  }
  return { nonce, expiresAt }
}

export async function activateDesktopTrial(
  db: Client,
  accountId: string,
  userId: string,
  nonce: string,
  proof: string,
) {
  const key = signingKey()
  decodeTrialField(nonce, 32)
  const message = Buffer.from(`matterdraft-desktop-trial-proof-v1:${nonce}`)
  const signature = decodeTrialField(proof, 64)
  const tx = await db.transaction('write')
  try {
    const now = Date.now()
    const challenge = (
      await tx.execute({
        sql: `SELECT c.public_key FROM trial_challenge c
        JOIN account_membership m ON m.account_id = c.account_id AND m.user_id = c.user_id
        WHERE c.account_id = ? AND c.user_id = ? AND c.nonce = ?
          AND c.expires_at > ? AND c.consumed_at IS NULL AND m.role = 'owner'`,
        args: [accountId, userId, nonce, now],
      })
    ).rows[0]
    if (!challenge) applicationFailure(403)
    const publicKey = String(challenge.public_key)
    const deviceKey = createPublicKey({
      key: Buffer.concat([ed25519SpkiPrefix, decodeTrialField(publicKey, 32)]),
      type: 'spki',
      format: 'der',
    })
    if (!verify(null, message, deviceKey, signature)) applicationFailure(403)
    await tx.execute({
      sql: 'UPDATE trial_challenge SET consumed_at = ? WHERE account_id = ?',
      args: [now, accountId],
    })
    const trial = (
      await tx.execute({
        sql: 'SELECT expires_at FROM licence_trial WHERE account_id = ?',
        args: [accountId],
      })
    ).rows[0]
    const expiresAt = trial ? Number(trial.expires_at) : now + trialDuration
    const installation = (
      await tx.execute({
        sql: 'SELECT user_id, public_key FROM trial_installation WHERE account_id = ?',
        args: [accountId],
      })
    ).rows[0]
    if (expiresAt <= now) {
      await tx.commit()
      return { status: 'trial_ended' as const, expiresAt, serverTime: now }
    }
    if (
      installation &&
      (installation.user_id !== userId || installation.public_key !== publicKey)
    ) {
      await tx.commit()
      return { status: 'device_limit' as const }
    }
    if (!trial) {
      if (!licenceTrialsEnabled()) applicationFailure(503)
      await tx.execute({
        sql: 'INSERT INTO licence_trial (account_id, started_by_user_id, started_at, expires_at) VALUES (?, ?, ?, ?)',
        args: [accountId, userId, now, expiresAt],
      })
      await tx.execute({
        sql: `INSERT INTO audit_event (id, account_id, actor_user_id, event_type, subject_type, subject_id, event_detail, created_at)
          VALUES (?, ?, ?, 'licence_trial.start', 'licence_trial', ?, ?, ?)`,
        args: [randomUUID(), accountId, userId, accountId, JSON.stringify({ expiresAt }), now],
      })
    }
    if (!installation) {
      await tx.execute({
        sql: 'INSERT INTO trial_installation (account_id, user_id, public_key, registered_at) VALUES (?, ?, ?, ?)',
        args: [accountId, userId, publicKey, now],
      })
    }
    const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url')
    const header = encode({ alg: 'EdDSA', typ: 'matterdraft-trial+jwt', kid: key.keyId })
    const payload = encode({
      iss: 'matterdraft-licensing',
      aud: 'matterdraft-studio-desktop',
      sub: userId,
      accountId,
      installationKey: publicKey,
      iat: Math.floor(now / 1000),
      exp: Math.ceil(expiresAt / 1000),
      expiresAt,
      version: 1,
    })
    const input = `${header}.${payload}`
    const grant = `${input}.${sign(null, Buffer.from(input), key.privateKey).toString('base64url')}`
    await tx.commit()
    return { status: 'active' as const, grant, expiresAt, serverTime: now }
  } catch (error) {
    await tx.rollback()
    throw error
  }
}
