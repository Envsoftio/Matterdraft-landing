import type { H3Event } from 'h3'
import { auth } from '../../lib/auth'
import { client } from '../../lib/db'
import { ensurePersonalAccount } from '../../lib/customer-accounts'
import { getStaffAccess, type StaffRole } from '../../lib/staff-access'
import { applicationFailure } from './application-error'

export type AccountRole = 'owner' | 'admin' | 'billing_manager' | 'member'

export async function requireUser(event: H3Event) {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user) applicationFailure(401)
  if (!session.user.emailVerified) applicationFailure(403)
  return session
}

export async function requireCustomer(event: H3Event) {
  const session = await requireUser(event)
  if (await getStaffAccess(session.user.id)) applicationFailure(403)
  return session
}

function listAccounts(userId: string) {
  return client.execute({
    sql: `SELECT a.id, a.name, a.account_type, m.role
      FROM account_membership m JOIN customer_account a ON a.id = m.account_id
      WHERE m.user_id = ? ORDER BY CASE a.account_type WHEN 'personal' THEN 0 ELSE 1 END, a.name`,
    args: [userId],
  })
}

export async function accountContext(event: H3Event) {
  const { user } = await requireUser(event)
  const staff = await getStaffAccess(user.id)
  let accounts = staff ? [] : (await listAccounts(user.id)).rows
  if (!staff && accounts.length === 0) {
    await ensurePersonalAccount(user)
    accounts = (await listAccounts(user.id)).rows
  }
  return {
    user: { id: user.id, name: user.name, email: user.email },
    accounts: accounts.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      accountType: String(row.account_type),
      role: String(row.role) as AccountRole,
    })),
    isStaff: staff !== null,
    staffRole: staff?.active ? staff.role : null,
  }
}

export async function requireAccount(event: H3Event, accountId: string) {
  const session = await requireCustomer(event)
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

export async function requireStaff(event: H3Event, role: StaffRole) {
  const { user } = await requireUser(event)
  const staff = await getStaffAccess(user.id)
  if (!staff?.active || staff.role !== role) applicationFailure(403)
  return user
}
