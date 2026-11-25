import { randomUUID } from 'node:crypto'
import { client } from './db'

export async function ensurePersonalAccount(user: { id: string; name: string; email: string }) {
  const now = Date.now()
  await client.batch(
    [
      {
        sql: `INSERT INTO customer_account (id, account_type, name, personal_owner_user_id, created_at)
          SELECT ?, 'personal', ?, ?, ?
          WHERE NOT EXISTS (SELECT 1 FROM staff_access WHERE user_id = ?)
            AND NOT EXISTS (SELECT 1 FROM account_membership WHERE user_id = ?)
            AND NOT EXISTS (
              SELECT 1 FROM organisation_invitation
              WHERE invitee_email = ? AND invitation_type = 'member'
                AND invitation_status = 'pending' AND expires_at > ?
            )
          ON CONFLICT(personal_owner_user_id) DO NOTHING`,
        args: [
          randomUUID(),
          `${user.name || 'My'} personal account`,
          user.id,
          now,
          user.id,
          user.id,
          user.email.toLowerCase(),
          now,
        ],
      },
      {
        sql: `INSERT INTO account_membership (account_id, user_id, role, created_at)
          SELECT id, personal_owner_user_id, 'owner', ?
          FROM customer_account WHERE personal_owner_user_id = ?
            AND NOT EXISTS (SELECT 1 FROM staff_access WHERE user_id = ?)
          ON CONFLICT(account_id, user_id) DO NOTHING`,
        args: [now, user.id, user.id],
      },
    ],
    'write',
  )
}

export async function listCustomerAccounts(userId: string) {
  const { rows } = await client.execute({
    sql: `SELECT a.id, a.name, a.account_type, m.role
      FROM account_membership m JOIN customer_account a ON a.id = m.account_id
      WHERE m.user_id = ? ORDER BY CASE a.account_type WHEN 'personal' THEN 0 ELSE 1 END, a.name, a.id`,
    args: [userId],
  })
  return rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    accountType: String(row.account_type) as 'personal' | 'organisation',
    role: String(row.role),
  }))
}
