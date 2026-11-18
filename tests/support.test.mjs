import test from 'node:test'
import assert from 'node:assert/strict'
import { createClient } from '@libsql/client'
import { Readable } from 'node:stream'
import {
  addReply,
  createTicket,
  getCustomerTicket,
  getStaffTicket,
  listCustomerTickets,
  listStaffTickets,
  readSupportInput,
  setTicketStatus,
  ticketStatuses,
  validKey,
  validText,
} from '../server/utils/support.ts'

const key = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const request = (
  body,
  origin = new URL(process.env.BETTER_AUTH_URL || 'http://localhost:3000').origin,
) => ({
  node: {
    req: Object.assign(Readable.from([body]), {
      headers: { 'content-type': 'application/json', origin },
    }),
  },
})
async function database() {
  const db = createClient({ url: 'file::memory:' })
  for (const sql of [
    'CREATE TABLE customer_account (id TEXT PRIMARY KEY, name TEXT)',
    'CREATE TABLE user (id TEXT PRIMARY KEY, email TEXT)',
    'CREATE TABLE account_membership (account_id TEXT, user_id TEXT)',
    'CREATE TABLE support_ticket (id TEXT PRIMARY KEY, account_id TEXT, created_by_user_id TEXT, category TEXT, subject TEXT, status TEXT, creation_key TEXT UNIQUE, created_at INTEGER, updated_at INTEGER)',
    'CREATE TABLE support_message (id TEXT PRIMARY KEY, ticket_id TEXT, author_user_id TEXT, author_type TEXT, body TEXT, submission_key TEXT UNIQUE, created_at INTEGER)',
    'CREATE TABLE audit_event (id TEXT PRIMARY KEY, account_id TEXT, actor_user_id TEXT, event_type TEXT, subject_type TEXT, subject_id TEXT, event_detail TEXT, created_at INTEGER)',
    "INSERT INTO customer_account VALUES ('account_a', 'Alpha'), ('account_b', 'Beta')",
    "INSERT INTO user VALUES ('creator', 'creator@example.test'), ('peer', 'peer@example.test'), ('staff', 'staff@example.test')",
    "INSERT INTO account_membership VALUES ('account_a', 'creator'), ('account_a', 'peer'), ('account_b', 'creator')",
  ])
    await db.execute(sql)
  return db
}

test('ticket privacy, membership, bounded input and safe query parameters', async () => {
  const db = await database()
  try {
    assert.equal(validText('x'.repeat(10001), 10000), false)
    assert.equal(validText('hello\u0000', 10000), false)
    assert.equal(validKey('bad'), false)
    assert.equal(validKey(key(1)), true)
    const created = await createTicket(
      db,
      'account_a',
      'creator',
      'bug',
      '<script>alert(1)</script>',
      'Private matter text',
      key(1),
    )
    assert.equal(
      (
        await createTicket(
          db,
          'account_a',
          'creator',
          'bug',
          '<script>alert(1)</script>',
          'Private matter text',
          key(1),
        )
      ).ticketId,
      created.ticketId,
    )
    await assert.rejects(
      createTicket(
        db,
        'account_a',
        'creator',
        'bug',
        '<script>alert(1)</script>',
        'Changed description',
        key(1),
      ),
      { code: 'CONFLICT' },
    )
    assert.equal((await listCustomerTickets(db, 'account_a', 'creator', 1)).tickets.length, 1)
    assert.equal((await listCustomerTickets(db, 'account_a', 'peer', 1)).tickets.length, 0)
    assert.equal(await getCustomerTicket(db, 'account_a', 'peer', created.ticketId), null)
    assert.equal(await getCustomerTicket(db, 'account_b', 'creator', created.ticketId), null)
    assert.equal(await getCustomerTicket(db, 'account_a', 'unrelated', created.ticketId), null)
    assert.equal((await listStaffTickets(db, "' OR 1=1 --", 1)).tickets.length, 0)
    const customer = await getCustomerTicket(db, 'account_a', 'creator', created.ticketId)
    assert.equal(customer.messages[0].body, 'Private matter text')
    assert.doesNotMatch(
      JSON.stringify(customer),
      /creator@example|accountName|creatorEmail|staff\.ticket/,
    )
    assert.equal(
      (await getStaffTicket(db, created.ticketId)).ticket.creatorEmail,
      'creator@example.test',
    )
  } finally {
    db.close()
  }
})

test('JSON request bytes are bounded before parsing', async () => {
  await assert.rejects(readSupportInput(request('{}', 'https://other.example.test')), {
    code: 'ACCESS_DENIED',
  })
  await assert.rejects(readSupportInput(request('{}', '')), { code: 'ACCESS_DENIED' })
  assert.deepEqual(await readSupportInput(request('{"body":"hello"}')), { body: 'hello' })
  await assert.rejects(readSupportInput(request(`{"body":"${'x'.repeat(50000)}"}`)), {
    code: 'INVALID_INPUT',
  })
  await assert.rejects(readSupportInput(request('{invalid')), { code: 'BAD_REQUEST' })
})

test('replies are idempotent, private, and follow active status; staff actions are audited', async () => {
  const db = await database()
  try {
    const { ticketId } = await createTicket(
      db,
      'account_a',
      'creator',
      'question',
      'Subject',
      'First',
      key(2),
    )
    await assert.rejects(
      addReply(db, ticketId, 'peer', 'customer', 'Forged', key(3), 'account_a'),
      { code: 'NOT_FOUND' },
    )
    await assert.rejects(
      addReply(db, ticketId, 'creator', 'customer', 'Wrong account', key(4), 'account_b'),
      { code: 'NOT_FOUND' },
    )
    const first = await addReply(
      db,
      ticketId,
      'creator',
      'customer',
      'Customer reply',
      key(5),
      'account_a',
    )
    assert.equal(
      (await addReply(db, ticketId, 'creator', 'customer', 'Customer reply', key(5), 'account_a'))
        .messageId,
      first.messageId,
    )
    await assert.rejects(
      addReply(db, ticketId, 'creator', 'customer', 'Changed text', key(5), 'account_a'),
      { code: 'CONFLICT' },
    )
    await addReply(db, ticketId, 'staff', 'staff', 'Staff reply', key(6))
    const customer = await getCustomerTicket(db, 'account_a', 'creator', ticketId)
    assert.equal(customer.ticket.status, 'awaiting_customer')
    assert.equal(
      customer.messages.find((message) => message.authorType === 'staff').submissionKey,
      null,
    )
    assert.equal(
      customer.messages.find((message) => message.authorType === 'staff').body,
      'Staff reply',
    )
    for (const status of ticketStatuses)
      assert.equal((await setTicketStatus(db, ticketId, 'staff', status)).status, status)
    await assert.rejects(
      addReply(db, ticketId, 'creator', 'customer', 'After close', key(7), 'account_a'),
      { code: 'CONFLICT' },
    )
    const audit = await db.execute(
      "SELECT event_type, event_detail FROM audit_event WHERE actor_user_id = 'staff'",
    )
    assert.equal(audit.rows.filter((row) => row.event_type === 'staff.ticket_replied').length, 1)
    assert.equal(
      audit.rows.filter((row) => row.event_type === 'staff.ticket_status_changed').length,
      5,
    )
    assert.doesNotMatch(JSON.stringify(audit.rows), /Staff reply|Customer reply|First/)
    assert.equal(
      (
        await db.execute({
          sql: 'SELECT COUNT(*) AS n FROM support_message WHERE ticket_id = ?',
          args: [ticketId],
        })
      ).rows[0].n,
      3,
    )
  } finally {
    db.close()
  }
})

test('simultaneous submissions with one key leave one reply', async () => {
  const db = await database()
  try {
    const { ticketId } = await createTicket(
      db,
      'account_a',
      'creator',
      'feedback',
      'Concurrency',
      'First',
      key(8),
    )
    const attempts = await Promise.allSettled([
      addReply(db, ticketId, 'creator', 'customer', 'One reply', key(9), 'account_a'),
      addReply(db, ticketId, 'creator', 'customer', 'One reply', key(9), 'account_a'),
    ])
    assert.ok(attempts.some((result) => result.status === 'fulfilled'))
    const retry = await addReply(
      db,
      ticketId,
      'creator',
      'customer',
      'One reply',
      key(9),
      'account_a',
    )
    assert.equal(retry.repeated, true)
    const rows = await db.execute({
      sql: 'SELECT COUNT(*) AS n FROM support_message WHERE submission_key = ?',
      args: [key(9)],
    })
    assert.equal(Number(rows.rows[0].n), 1)
  } finally {
    db.close()
  }
})
