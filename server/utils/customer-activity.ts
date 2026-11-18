import { randomUUID } from 'node:crypto'
import type { Client } from '@libsql/client'

const pageSize = 25
const customerAccount = `NOT EXISTS (
  SELECT 1 FROM staff_access s WHERE s.user_id = a.personal_owner_user_id
)`
const membershipEvents = `e.event_type IN (
  'invitation.created', 'invitation.revoked', 'invitation.reissued', 'invitation.accepted',
  'membership.role_changed', 'membership.removed', 'ownership.transfer_requested', 'ownership.transferred'
)`
const needsSupport = "t.status IN ('open', 'awaiting_support')"
const matchingAudit = `e.account_id = a.id AND ${membershipEvents}`
const matchingMessage = "t.account_id = a.id AND m.author_type = 'customer'"

export async function businessOperations(db: Client, since: number) {
  const [accounts, issues] = await Promise.all([
    db.execute({
      sql: `SELECT
        COUNT(CASE WHEN a.account_type = 'personal' THEN 1 END) AS personal,
        COUNT(CASE WHEN a.account_type = 'organisation' THEN 1 END) AS organisations,
        COUNT(CASE WHEN a.created_at >= ? OR EXISTS (
          SELECT 1 FROM audit_event e WHERE ${matchingAudit} AND e.created_at >= ?
        ) OR EXISTS (
          SELECT 1 FROM support_message m JOIN support_ticket t ON t.id = m.ticket_id
          WHERE ${matchingMessage} AND m.created_at >= ?
        ) THEN 1 END) AS active
        FROM customer_account a WHERE ${customerAccount}`,
      args: [since, since, since],
    }),
    db.execute({
      sql: `SELECT COUNT(CASE WHEN t.created_at >= ? THEN 1 END) AS new_tickets,
        COUNT(CASE WHEN ${needsSupport} THEN 1 END) AS needs_support
        FROM support_ticket t JOIN customer_account a ON a.id = t.account_id
        WHERE ${customerAccount}`,
      args: [since],
    }),
  ])
  return {
    personal: Number(accounts.rows[0]?.personal),
    organisations: Number(accounts.rows[0]?.organisations),
    activeAccounts: Number(accounts.rows[0]?.active),
    newTickets: Number(issues.rows[0]?.new_tickets),
    needsSupport: Number(issues.rows[0]?.needs_support),
  }
}

export async function customerIssues(db: Client) {
  const { rows } = await db.execute(`SELECT t.id, t.subject, t.category, t.updated_at,
    a.name AS account_name, u.name AS customer_name
    FROM support_ticket t JOIN customer_account a ON a.id = t.account_id
    JOIN user u ON u.id = t.created_by_user_id
    WHERE ${needsSupport} AND ${customerAccount}
    ORDER BY t.updated_at, t.id LIMIT 5`)
  return rows.map((row) => ({
    id: String(row.id),
    subject: String(row.subject),
    category: String(row.category),
    accountName: String(row.account_name),
    customerName: String(row.customer_name),
    updatedAt: Number(row.updated_at),
  }))
}

export async function listAccountActivity(db: Client, search: string, type: string, page: number) {
  const { rows } = await db.execute({
    sql: `WITH accounts AS (
      SELECT a.id, a.name, a.account_type, a.created_at FROM customer_account a
      LEFT JOIN user u ON u.id = a.personal_owner_user_id
      WHERE ${customerAccount} AND (? = '' OR a.account_type = ?)
        AND (? = '' OR instr(lower(a.name), ?) > 0 OR instr(lower(u.email), ?) > 0)
      ORDER BY a.name COLLATE NOCASE, a.id LIMIT ? OFFSET ?
    )
    SELECT a.id, a.name, a.account_type,
      MAX(a.created_at,
        COALESCE((SELECT MAX(e.created_at) FROM audit_event e WHERE ${matchingAudit}), 0),
        COALESCE((SELECT MAX(m.created_at) FROM support_message m
          JOIN support_ticket t ON t.id = m.ticket_id WHERE ${matchingMessage}), 0)
      ) AS last_activity_at,
      (SELECT COUNT(*) FROM support_ticket t WHERE t.account_id = a.id AND ${needsSupport}) AS needs_support
    FROM accounts a ORDER BY a.name COLLATE NOCASE, a.id`,
    args: [type, type, search, search, search, pageSize + 1, (page - 1) * pageSize],
  })
  return {
    accounts: rows.slice(0, pageSize).map((row) => ({
      id: String(row.id),
      name: String(row.name),
      accountType: String(row.account_type),
      lastActivityAt: Number(row.last_activity_at),
      needsSupport: Number(row.needs_support),
    })),
    hasMore: rows.length > pageSize,
  }
}

export async function getAccountActivity(db: Client, accountId: string, page: number) {
  const { rows: accounts } = await db.execute({
    sql: `SELECT a.id, a.name, a.account_type, a.personal_owner_user_id,
      (SELECT COUNT(*) FROM account_membership WHERE account_id = a.id) AS members
      FROM customer_account a WHERE a.id = ? AND ${customerAccount}`,
    args: [accountId],
  })
  const account = accounts[0]
  if (!account) return null

  const { rows: events } = await db.execute({
    sql: `SELECT a.id, 'account.created' AS event, a.created_at, NULL AS person, NULL AS ticket_id
      FROM customer_account a WHERE a.id = ?
    UNION ALL
      SELECT e.id, e.event_type, e.created_at, u.name, NULL
      FROM audit_event e LEFT JOIN user u ON u.id = e.actor_user_id
      WHERE e.account_id = ? AND ${membershipEvents}
    UNION ALL
      SELECT m.id, 'support.customer_message', m.created_at, u.name, t.id
      FROM support_message m JOIN support_ticket t ON t.id = m.ticket_id
      JOIN user u ON u.id = m.author_user_id
      WHERE t.account_id = ? AND m.author_type = 'customer'
    ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
    args: [accountId, accountId, accountId, pageSize + 1, (page - 1) * pageSize],
  })
  return {
    account: {
      id: String(account.id),
      name: String(account.name),
      accountType: String(account.account_type),
      ownerId: account.personal_owner_user_id ? String(account.personal_owner_user_id) : null,
      members: Number(account.members),
    },
    events: events.slice(0, pageSize).map((row) => ({
      id: String(row.id),
      event: String(row.event),
      person: row.person ? String(row.person) : null,
      ticketId: row.ticket_id ? String(row.ticket_id) : null,
      createdAt: Number(row.created_at),
    })),
    hasMore: events.length > pageSize,
  }
}

export function auditActivityRead(db: Client, actorId: string, accountId?: string) {
  return db.execute({
    sql: `INSERT INTO audit_event
      (id, actor_user_id, event_type, subject_type, subject_id, event_detail, created_at)
      VALUES (?, ?, 'staff.activity_viewed', ?, ?, 'Viewed customer operations', ?)`,
    args: [
      randomUUID(),
      actorId,
      accountId ? 'account' : 'customer_activity',
      accountId || 'all',
      Date.now(),
    ],
  })
}
