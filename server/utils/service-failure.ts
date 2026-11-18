import type { Client } from '@libsql/client'

const hourMs = 60 * 60 * 1000
const hourStart = (time: number) => Math.floor(time / hourMs) * hourMs

export async function recordServiceFailure(db: Client, status: number, time = Date.now()) {
  const hour = hourStart(time)
  await db.batch(
    [
      {
        sql: `INSERT INTO service_failure_count (hour_started_at, status_code, request_count)
          VALUES (?, ?, 1) ON CONFLICT(hour_started_at, status_code)
          DO UPDATE SET request_count = request_count + 1`,
        args: [hour, status],
      },
      {
        sql: 'DELETE FROM service_failure_count WHERE hour_started_at < ?',
        args: [hour - 30 * 24 * hourMs],
      },
    ],
    'write',
  )
}

export async function recentServiceFailures(db: Client, time: number) {
  const { rows } = await db.execute({
    sql: `SELECT COALESCE(SUM(request_count), 0) AS failures,
      COALESCE(SUM(CASE WHEN status_code = 503 THEN request_count ELSE 0 END), 0) AS unavailable
      FROM service_failure_count WHERE hour_started_at BETWEEN ? AND ?`,
    args: [hourStart(time) - 23 * hourMs, hourStart(time)],
  })
  return {
    failures: Number(rows[0]?.failures),
    unavailable: Number(rows[0]?.unavailable),
  }
}
