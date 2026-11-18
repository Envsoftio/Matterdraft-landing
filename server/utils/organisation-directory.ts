import type { Client } from '@libsql/client'

const pageSize = 25

export async function listOrganisations(db: Client, search: string, page: number) {
  const term = search.toLowerCase()
  const result = await db.execute({
    sql: `SELECT a.id, a.name, a.created_at, COUNT(m.user_id) AS member_count
      FROM customer_account a LEFT JOIN account_membership m ON m.account_id = a.id
      WHERE a.account_type = 'organisation' AND (? = '' OR instr(lower(a.name), ?) > 0)
      GROUP BY a.id ORDER BY a.created_at DESC, a.id DESC LIMIT ? OFFSET ?`,
    args: [term, term, pageSize + 1, (page - 1) * pageSize],
  })
  return {
    organisations: result.rows.slice(0, pageSize).map((row) => ({
      id: String(row.id),
      name: String(row.name),
      createdAt: Number(row.created_at),
      memberCount: Number(row.member_count),
    })),
    page,
    hasMore: result.rows.length > pageSize,
  }
}

export async function getOrganisationDetails(db: Client, accountId: string, now = Date.now()) {
  const account = await db.execute({
    sql: "SELECT id, name, created_at FROM customer_account WHERE id = ? AND account_type = 'organisation' LIMIT 1",
    args: [accountId],
  })
  if (!account.rows[0]) return null
  const [members, invitations] = await Promise.all([
    db.execute({
      sql: `SELECT u.id, u.name, u.email, m.role, m.created_at FROM account_membership m
        JOIN user u ON u.id = m.user_id WHERE m.account_id = ?
        ORDER BY CASE m.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END, u.name, u.id`,
      args: [accountId],
    }),
    db.execute({
      sql: `SELECT id, invitee_email, invited_role, invitation_type, expires_at, created_at
        FROM organisation_invitation WHERE account_id = ? AND invitation_status = 'pending'
        ORDER BY created_at DESC, id DESC LIMIT 100`,
      args: [accountId],
    }),
  ])
  return {
    organisation: {
      id: String(account.rows[0]!.id),
      name: String(account.rows[0]!.name),
      createdAt: Number(account.rows[0]!.created_at),
    },
    members: members.rows.map((row) => ({
      userId: String(row.id),
      name: String(row.name),
      email: String(row.email),
      role: String(row.role),
      joinedAt: Number(row.created_at),
    })),
    invitations: invitations.rows.map((row) => ({
      id: String(row.id),
      email: String(row.invitee_email),
      role: String(row.invited_role),
      type: String(row.invitation_type),
      status: Number(row.expires_at) <= now ? 'expired' : 'pending',
      createdAt: Number(row.created_at),
      expiresAt: Number(row.expires_at),
    })),
  }
}
