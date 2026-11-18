import { randomUUID } from 'node:crypto'
import type { H3Event } from 'h3'
import { auth } from '../../lib/auth'
import { client } from '../../lib/db'
import { applicationFailure } from './application-error'

export type AccountRole = 'owner' | 'admin' | 'billing_manager' | 'member'

export async function requireUser(event: H3Event) {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user) applicationFailure(401)
  if (!session.user.emailVerified) applicationFailure(403)
  return session
}

export async function ensurePersonalAccount(userId: string, userName: string) {
  const existing = await client.execute({
    sql: 'SELECT id FROM customer_account WHERE personal_owner_user_id = ?',
    args: [userId],
  })
  if (existing.rows[0]) return String(existing.rows[0].id)

  const tx = await client.transaction('write')
  try {
    const id = randomUUID()
    const now = Date.now()
    await tx.execute({
      sql: 'INSERT OR IGNORE INTO customer_account (id, account_type, name, personal_owner_user_id, created_at) VALUES (?, ?, ?, ?, ?)',
      args: [id, 'personal', `${userName || 'My'} personal account`, userId, now],
    })
    const result = await tx.execute({
      sql: 'SELECT id FROM customer_account WHERE personal_owner_user_id = ?',
      args: [userId],
    })
    const accountId = String(result.rows[0]?.id || '')
    if (!accountId) throw new Error('Could not create personal account')
    await tx.execute({
      sql: 'INSERT OR IGNORE INTO account_membership (account_id, user_id, role, created_at) VALUES (?, ?, ?, ?)',
      args: [accountId, userId, 'owner', now],
    })
    await tx.commit()
    return accountId
  } catch (error) {
    await tx.rollback()
    throw error
  }
}

export async function accountContext(event: H3Event) {
  const session = await requireUser(event)
  await ensurePersonalAccount(session.user.id, session.user.name)
  const accounts = await client.execute({
    sql: `SELECT a.id, a.name, a.account_type, m.role
      FROM account_membership m JOIN customer_account a ON a.id = m.account_id
      WHERE m.user_id = ? ORDER BY CASE a.account_type WHEN 'personal' THEN 0 ELSE 1 END, a.name`,
    args: [session.user.id],
  })
  const staff = await client.execute({
    sql: 'SELECT role FROM staff_access WHERE user_id = ? AND active = 1',
    args: [session.user.id],
  })
  return {
    user: { id: session.user.id, name: session.user.name, email: session.user.email },
    accounts: accounts.rows.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      accountType: String(row.account_type),
      role: String(row.role) as AccountRole,
    })),
    staffRole: staff.rows[0] ? String(staff.rows[0].role) : null,
  }
}

export async function requireAccount(event: H3Event, accountId: string) {
  const session = await requireUser(event)
  if (!accountId) applicationFailure(404)
  const result = await client.execute({
    sql: `SELECT a.id, a.name, a.account_type, m.role FROM account_membership m
      JOIN customer_account a ON a.id = m.account_id
      WHERE m.user_id = ? AND m.account_id = ? LIMIT 1`,
    args: [session.user.id, accountId],
  })
  if (!result.rows[0]) applicationFailure(404)
  const row = result.rows[0]
  return {
    user: session.user,
    account: {
      id: String(row.id),
      name: String(row.name),
      accountType: String(row.account_type),
      role: String(row.role) as AccountRole,
    },
  }
}

export async function requireStaff(
  event: H3Event,
  role: 'super_admin' | 'support_operator' | 'billing_operator',
) {
  const session = await requireUser(event)
  const user = session.user
  const result = await client.execute({
    sql: 'SELECT role FROM staff_access WHERE user_id = ? AND active = 1 LIMIT 1',
    args: [user.id],
  })
  if (!result.rows[0] || result.rows[0].role !== role) applicationFailure(403)
  return user
}
