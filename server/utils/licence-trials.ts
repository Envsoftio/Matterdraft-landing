import type { Client, Row } from '@libsql/client'

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
