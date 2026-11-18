import { client } from './db'
import type { staffAccess } from './customer-schema'

export type StaffRole = (typeof staffAccess.$inferSelect)['role']

export async function getStaffAccess(userId: string) {
  const { rows } = await client.execute({
    sql: 'SELECT role, active FROM staff_access WHERE user_id = ?',
    args: [userId],
  })
  const row = rows[0]
  return row ? { role: row.role as StaffRole, active: Boolean(row.active) } : null
}
