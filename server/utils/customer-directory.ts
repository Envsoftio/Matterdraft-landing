import type { Client } from '@libsql/client'

export const customerPageSize = 25

export async function listCustomers(db: Client, search: string, page: number) {
  const term = search.toLowerCase()
  const result = await db.execute({
    sql: `SELECT u.id, u.name, u.email, u.email_verified, u.created_at,
      COUNT(m.account_id) AS account_count
      FROM user u LEFT JOIN account_membership m ON m.user_id = u.id
      WHERE (? = '' OR instr(lower(u.name), ?) > 0 OR instr(lower(u.email), ?) > 0)
      GROUP BY u.id
      ORDER BY u.created_at DESC, u.id DESC LIMIT ? OFFSET ?`,
    args: [term, term, term, customerPageSize + 1, (page - 1) * customerPageSize],
  })
  return {
    customers: result.rows.slice(0, customerPageSize).map((row) => ({
      id: String(row.id),
      name: String(row.name),
      email: String(row.email),
      emailVerified: Boolean(row.email_verified),
      createdAt: Number(row.created_at),
      accountCount: Number(row.account_count),
    })),
    page,
    hasMore: result.rows.length > customerPageSize,
  }
}
