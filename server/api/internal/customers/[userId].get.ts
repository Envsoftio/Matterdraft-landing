import { randomUUID } from 'node:crypto'
import { applicationRoute, applicationFailure } from '../../../utils/application-error'
import { client } from '../../../../lib/db'
import { requireStaff } from '../../../utils/customer-account'

export default applicationRoute('/api/internal/customers/[userId]', async event => {
  const actor = await requireStaff(event, 'super_admin')
  const userId = getRouterParam(event, 'userId') || ''
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(userId)) applicationFailure(404)

  const customer = await client.execute({
    sql: 'SELECT id, name, email, email_verified, created_at FROM user WHERE id = ? LIMIT 1',
    args: [userId],
  })
  const row = customer.rows[0]
  if (!row) applicationFailure(404)

  const memberships = await client.execute({
    sql: `SELECT a.id, a.name, a.account_type, m.role, m.created_at
      FROM account_membership m JOIN customer_account a ON a.id = m.account_id
      WHERE m.user_id = ? ORDER BY a.name, a.id`,
    args: [userId],
  })
  await client.execute({
    sql: `INSERT INTO audit_event
      (id, actor_user_id, event_type, subject_type, subject_id, event_detail, created_at)
      VALUES (?, ?, 'staff.customer_viewed', 'user', ?, 'Viewed customer profile', ?)`,
    args: [randomUUID(), actor.id, userId, Date.now()],
  })
  return {
    customer: {
      id: String(row.id), name: String(row.name), email: String(row.email),
      emailVerified: Boolean(row.email_verified), createdAt: Number(row.created_at),
    },
    memberships: memberships.rows.map(membership => ({
      accountId: String(membership.id), accountName: String(membership.name),
      accountType: String(membership.account_type), role: String(membership.role),
      joinedAt: Number(membership.created_at),
    })),
  }
})
