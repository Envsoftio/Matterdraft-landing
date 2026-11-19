import { randomUUID } from 'node:crypto'
import type { Client } from '@libsql/client'
import { applicationFailure } from './application-error.ts'

export const ticketStatuses = [
  'open',
  'awaiting_support',
  'awaiting_customer',
  'resolved',
  'closed',
] as const
export const ticketCategories = ['question', 'bug', 'billing', 'feedback'] as const
const keyPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
export const idPattern = /^[A-Za-z0-9_-]{16,128}$/

export { readSameOriginJson as readSupportInput } from './json-request.ts'

export function validKey(value: unknown): value is string {
  return typeof value === 'string' && keyPattern.test(value)
}
export function validText(value: unknown, max: number): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    value.length <= max &&
    !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)
  )
}
export function ticketView(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    accountId: String(row.account_id),
    category: String(row.category),
    subject: String(row.subject),
    status: String(row.status),
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  }
}
export function messageView(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    authorType: String(row.author_type),
    body: String(row.body),
    submissionKey: String(row.submission_key),
    createdAt: Number(row.created_at),
  }
}

export async function listCustomerTickets(
  db: Client,
  accountId: string,
  userId: string,
  page: number,
) {
  const rows = await db.execute({
    sql: 'SELECT id, account_id, category, subject, status, created_at, updated_at FROM support_ticket WHERE account_id = ? AND created_by_user_id = ? ORDER BY updated_at DESC, id DESC LIMIT 26 OFFSET ?',
    args: [accountId, userId, (page - 1) * 25],
  })
  return { tickets: rows.rows.slice(0, 25).map(ticketView), page, hasMore: rows.rows.length > 25 }
}
export async function getCustomerTicket(
  db: Client,
  accountId: string,
  userId: string,
  ticketId: string,
) {
  const ticket = await db.execute({
    sql: `SELECT t.id, t.account_id, t.category, t.subject, t.status, t.created_at, t.updated_at
    FROM support_ticket t JOIN account_membership m ON m.account_id = t.account_id AND m.user_id = ?
    WHERE t.id = ? AND t.account_id = ? AND t.created_by_user_id = ? LIMIT 1`,
    args: [userId, ticketId, accountId, userId],
  })
  if (!ticket.rows[0]) return null
  const messages = await db.execute({
    sql: 'SELECT id, author_user_id, author_type, body, submission_key, created_at FROM support_message WHERE ticket_id = ? ORDER BY created_at DESC, id DESC LIMIT 501',
    args: [ticketId],
  })
  return {
    ticket: ticketView(ticket.rows[0]),
    messages: messages.rows
      .slice(0, 500)
      .reverse()
      .map((row) => ({
        ...messageView(row),
        submissionKey:
          row.author_type === 'customer' && row.author_user_id === userId
            ? String(row.submission_key)
            : null,
      })),
    hasMoreMessages: messages.rows.length > 500,
  }
}
export async function listStaffTickets(db: Client, search: string, page: number) {
  const term = search.toLowerCase()
  const rows = await db.execute({
    sql: `SELECT t.id, t.account_id, t.category, t.subject, t.status, t.created_at, t.updated_at,
    a.name AS account_name, u.email AS creator_email FROM support_ticket t
    JOIN customer_account a ON a.id = t.account_id JOIN user u ON u.id = t.created_by_user_id
    WHERE (? = '' OR instr(lower(t.subject), ?) > 0 OR instr(lower(u.email), ?) > 0 OR instr(lower(a.name), ?) > 0)
    ORDER BY t.updated_at DESC, t.id DESC LIMIT 26 OFFSET ?`,
    args: [term, term, term, term, (page - 1) * 25],
  })
  return {
    tickets: rows.rows.slice(0, 25).map((row) => ({
      ...ticketView(row),
      accountName: String(row.account_name),
      creatorEmail: String(row.creator_email),
    })),
    page,
    hasMore: rows.rows.length > 25,
  }
}
export async function getStaffTicket(db: Client, ticketId: string) {
  const ticket = await db.execute({
    sql: `SELECT t.*, a.name AS account_name, u.email AS creator_email FROM support_ticket t
    JOIN customer_account a ON a.id = t.account_id JOIN user u ON u.id = t.created_by_user_id WHERE t.id = ? LIMIT 1`,
    args: [ticketId],
  })
  if (!ticket.rows[0]) return null
  const row = ticket.rows[0]
  const messages = await db.execute({
    sql: 'SELECT id, author_type, body, submission_key, created_at FROM support_message WHERE ticket_id = ? ORDER BY created_at DESC, id DESC LIMIT 501',
    args: [ticketId],
  })
  return {
    ticket: {
      ...ticketView(row),
      accountName: String(row.account_name),
      creatorEmail: String(row.creator_email),
    },
    messages: messages.rows.slice(0, 500).reverse().map(messageView),
    hasMoreMessages: messages.rows.length > 500,
  }
}

export async function createTicket(
  db: Client,
  accountId: string,
  userId: string,
  category: string,
  subject: string,
  body: string,
  key: string,
) {
  const tx = await db.transaction('write')
  try {
    const existing = await tx.execute({
      sql: `SELECT t.id, t.account_id, t.created_by_user_id, t.category, t.subject, m.body
      FROM support_ticket t JOIN support_message m ON m.ticket_id = t.id AND m.submission_key = t.creation_key
      WHERE t.creation_key = ?`,
      args: [key],
    })
    if (existing.rows[0]) {
      const row = existing.rows[0]
      if (
        row.account_id !== accountId ||
        row.created_by_user_id !== userId ||
        row.category !== category ||
        row.subject !== subject ||
        row.body !== body
      )
        applicationFailure(409)
      await tx.commit()
      return { ticketId: String(row.id), repeated: true }
    }
    const id = randomUUID(),
      now = Date.now()
    await tx.execute({
      sql: `INSERT INTO support_ticket (id, account_id, created_by_user_id, category, subject, status, creation_key, created_at, updated_at)
      SELECT ?, ?, ?, ?, ?, 'awaiting_support', ?, ?, ? WHERE EXISTS (SELECT 1 FROM account_membership WHERE account_id = ? AND user_id = ?)`,
      args: [id, accountId, userId, category, subject, key, now, now, accountId, userId],
    })
    const inserted = await tx.execute({
      sql: 'SELECT id FROM support_ticket WHERE id = ?',
      args: [id],
    })
    if (!inserted.rows[0]) applicationFailure(404)
    await tx.execute({
      sql: "INSERT INTO support_message (id, ticket_id, author_user_id, author_type, body, submission_key, created_at) VALUES (?, ?, ?, 'customer', ?, ?, ?)",
      args: [randomUUID(), id, userId, body, key, now],
    })
    await tx.commit()
    return { ticketId: id, repeated: false }
  } catch (error) {
    await tx.rollback()
    throw error
  }
}

export async function addReply(
  db: Client,
  ticketId: string,
  actorId: string,
  authorType: 'customer' | 'staff',
  body: string,
  key: string,
  accountId?: string,
) {
  const tx = await db.transaction('write')
  try {
    const ticket = await tx.execute({
      sql: `SELECT t.status, t.account_id, t.created_by_user_id FROM support_ticket t
      ${authorType === 'customer' ? 'JOIN account_membership m ON m.account_id = t.account_id AND m.user_id = ?' : ''}
      WHERE t.id = ? ${authorType === 'customer' ? 'AND t.account_id = ? AND t.created_by_user_id = ?' : ''} LIMIT 1`,
      args: authorType === 'customer' ? [actorId, ticketId, accountId || '', actorId] : [ticketId],
    })
    if (!ticket.rows[0]) applicationFailure(404)
    const existing = await tx.execute({
      sql: 'SELECT id, ticket_id, author_user_id, author_type, body FROM support_message WHERE submission_key = ?',
      args: [key],
    })
    if (existing.rows[0]) {
      const row = existing.rows[0]
      if (
        row.ticket_id !== ticketId ||
        row.author_user_id !== actorId ||
        row.author_type !== authorType ||
        row.body !== body
      )
        applicationFailure(409)
      await tx.commit()
      return { messageId: String(row.id), repeated: true }
    }
    if (['resolved', 'closed'].includes(String(ticket.rows[0].status))) applicationFailure(409)
    const id = randomUUID(),
      now = Date.now()
    await tx.execute({
      sql: 'INSERT INTO support_message (id, ticket_id, author_user_id, author_type, body, submission_key, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [id, ticketId, actorId, authorType, body, key, now],
    })
    await tx.execute({
      sql: 'UPDATE support_ticket SET status = ?, updated_at = ? WHERE id = ?',
      args: [authorType === 'customer' ? 'awaiting_support' : 'awaiting_customer', now, ticketId],
    })
    if (authorType === 'staff')
      await writeStaffAudit(
        tx,
        actorId,
        String(ticket.rows[0].account_id),
        'staff.ticket_replied',
        ticketId,
      )
    await tx.commit()
    return { messageId: id, repeated: false }
  } catch (error) {
    await tx.rollback()
    throw error
  }
}

export async function setTicketStatus(
  db: Client,
  ticketId: string,
  actorId: string,
  status: string,
) {
  const tx = await db.transaction('write')
  try {
    const ticket = await tx.execute({
      sql: 'SELECT account_id, status FROM support_ticket WHERE id = ?',
      args: [ticketId],
    })
    if (!ticket.rows[0]) applicationFailure(404)
    if (ticket.rows[0].status !== status) {
      await tx.execute({
        sql: 'UPDATE support_ticket SET status = ?, updated_at = ? WHERE id = ?',
        args: [status, Date.now(), ticketId],
      })
      await writeStaffAudit(
        tx,
        actorId,
        String(ticket.rows[0].account_id),
        'staff.ticket_status_changed',
        ticketId,
      )
    }
    await tx.commit()
    return { status }
  } catch (error) {
    await tx.rollback()
    throw error
  }
}

export async function writeStaffAudit(
  db: Pick<Client, 'execute'>,
  actorId: string,
  accountId: string | null,
  eventType: string,
  subjectId: string,
) {
  await db.execute({
    sql: 'INSERT INTO audit_event (id, account_id, actor_user_id, event_type, subject_type, subject_id, event_detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    args: [
      randomUUID(),
      accountId,
      actorId,
      eventType,
      'support_ticket',
      subjectId,
      eventType,
      Date.now(),
    ],
  })
}
