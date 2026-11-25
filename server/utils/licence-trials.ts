import { randomUUID } from 'node:crypto'
import type { Client, Row } from '@libsql/client'
import { applicationFailure } from './application-error.ts'

export const trialDuration = 7 * 24 * 60 * 60 * 1000

export function licenceTrialsEnabled() {
  const setting = process.env.LICENCE_TRIALS_ENABLED
  return setting ? setting === 'true' : process.env.NODE_ENV !== 'production'
}

function trialView(trial: Row | undefined, now: number) {
  if (!trial)
    return { status: 'available' as const, startedAt: null, expiresAt: null, access: null }
  const expiresAt = Number(trial.expires_at)
  const active = expiresAt > now
  return {
    status: active ? ('active' as const) : ('ended' as const),
    startedAt: Number(trial.started_at),
    expiresAt,
    access: active ? ('full' as const) : null,
  }
}

export async function getLicenceTrial(db: Client, accountId: string, now = Date.now()) {
  const { rows } = await db.execute({
    sql: 'SELECT started_at, expires_at FROM licence_trial WHERE account_id = ?',
    args: [accountId],
  })
  return trialView(rows[0], now)
}

export async function listDesktopTrialExpiries(db: Client, userId: string) {
  const { rows } = await db.execute({
    sql: `SELECT t.account_id, t.expires_at
      FROM licence_trial t JOIN account_membership m ON m.account_id = t.account_id
      WHERE m.user_id = ? AND m.role IN ('owner', 'billing_manager')`,
    args: [userId],
  })
  return {
    serverTime: Date.now(),
    canStart: licenceTrialsEnabled(),
    expiries: Object.fromEntries(
      rows.map((row) => [String(row.account_id), Number(row.expires_at)]),
    ),
  }
}

export async function startLicenceTrial(db: Client, accountId: string, actorId: string) {
  const now = Date.now()
  const expiresAt = now + trialDuration
  const [, , state] = await db.batch(
    [
      {
        sql: `INSERT INTO licence_trial (account_id, started_by_user_id, started_at, expires_at)
        SELECT ?, ?, ?, ? FROM account_membership WHERE account_id = ? AND user_id = ? AND role = 'owner'
        ON CONFLICT(account_id) DO NOTHING`,
        args: [accountId, actorId, now, expiresAt, accountId, actorId],
      },
      {
        sql: `INSERT INTO audit_event (id, account_id, actor_user_id, event_type, subject_type, subject_id, event_detail, created_at)
        SELECT ?, ?, ?, 'licence_trial.start', 'licence_trial', ?, ?, ? WHERE changes() = 1`,
        args: [randomUUID(), accountId, actorId, accountId, JSON.stringify({ expiresAt }), now],
      },
      {
        sql: `SELECT t.started_at, t.expires_at FROM account_membership m
        LEFT JOIN licence_trial t ON t.account_id = m.account_id
        WHERE m.account_id = ? AND m.user_id = ? AND m.role = 'owner'`,
        args: [accountId, actorId],
      },
    ],
    'write',
  )
  const grant = state?.rows[0]
  if (!grant) applicationFailure(403)
  if (grant.started_at === null) applicationFailure(409)
  return trialView(grant, Date.now())
}
