import { createPrivateKey, randomUUID, sign } from 'node:crypto'
import type { Client } from '@libsql/client'
import { applicationFailure } from './application-error.ts'
import { licenceTrialsEnabled, trialDuration } from './licence-trials.ts'

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

export async function activateDesktopTrial(
  db: Client,
  accountId: string,
  userId: string,
) {
  const key = signingKey()
  const tx = await db.transaction('write')
  try {
    const now = Date.now()
    const owner = await tx.execute({
      sql: "SELECT 1 FROM account_membership WHERE account_id = ? AND user_id = ? AND role = 'owner'",
      args: [accountId, userId],
    })
    if (!owner.rows.length) applicationFailure(403)
    const trial = (
      await tx.execute({
        sql: 'SELECT expires_at FROM licence_trial WHERE account_id = ?',
        args: [accountId],
      })
    ).rows[0]
    const expiresAt = trial ? Number(trial.expires_at) : now + trialDuration
    if (expiresAt <= now) {
      await tx.commit()
      return { status: 'trial_ended' as const, expiresAt, serverTime: now }
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
    const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url')
    const header = encode({ alg: 'EdDSA', typ: 'matterdraft-trial+jwt', kid: key.keyId })
    const payload = encode({
      iss: 'matterdraft-licensing',
      aud: 'matterdraft-studio-desktop',
      sub: userId,
      accountId,
      iat: Math.floor(now / 1000),
      exp: Math.ceil(expiresAt / 1000),
      expiresAt,
      version: 2,
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
