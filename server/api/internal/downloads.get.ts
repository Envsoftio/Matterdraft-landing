import { randomUUID } from 'node:crypto'
import { client } from '../../../lib/db'
import { applicationFailure, applicationRoute } from '../../utils/application-error'
import { requireStaff } from '../../utils/customer-account'

export default applicationRoute('/api/internal/downloads', async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  const actor = await requireStaff(event, 'super_admin')
  const { before } = getQuery(event)
  const cursor = typeof before === 'string' ? /^(\d{1,13}):([a-f0-9-]{36})$/.exec(before) : null
  if (before !== undefined && !cursor) applicationFailure(422)

  const pageSize = 50
  const { rows } = await client.execute({
    sql: `SELECT d.id, d.user_id, d.platform, d.version, d.requested_at, u.name, u.email
      FROM desktop_download d JOIN user u ON u.id = d.user_id
      ${cursor ? 'WHERE (d.requested_at, d.id) < (?, ?)' : ''}
      ORDER BY d.requested_at DESC, d.id DESC LIMIT ?`,
    args: cursor ? [Number(cursor[1]), cursor[2]!, pageSize + 1] : [pageSize + 1],
  })
  await client.execute({
    sql: `INSERT INTO audit_event
      (id, actor_user_id, event_type, subject_type, subject_id, event_detail, created_at)
      VALUES (?, ?, 'staff.desktop_downloads_viewed', 'desktop_download', 'history', 'Viewed installer download history', ?)`,
    args: [randomUUID(), actor.id, Date.now()],
  })

  const downloads = rows.slice(0, pageSize).map((row) => ({
    id: String(row.id),
    userId: String(row.user_id),
    name: String(row.name),
    email: String(row.email),
    platform: String(row.platform),
    version: String(row.version),
    requestedAt: Number(row.requested_at),
  }))
  const last = downloads.at(-1)
  return {
    downloads,
    nextCursor: rows.length > pageSize && last ? `${last.requestedAt}:${last.id}` : null,
  }
})
