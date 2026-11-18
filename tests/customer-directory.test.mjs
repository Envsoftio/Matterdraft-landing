import test from 'node:test'
import assert from 'node:assert/strict'
import { createClient } from '@libsql/client'
import { listCustomers } from '../server/utils/customer-directory.ts'

test('customer directory filters safely, counts memberships, and pages without repeats', async () => {
  const db = createClient({ url: 'file::memory:' })
  try {
    await db.execute(
      'CREATE TABLE user (id TEXT PRIMARY KEY, name TEXT, email TEXT, email_verified INTEGER, created_at INTEGER)',
    )
    await db.execute('CREATE TABLE account_membership (account_id TEXT, user_id TEXT)')
    for (let index = 0; index < 27; index++) {
      const id = `user_${String(index).padStart(2, '0')}`
      await db.execute({
        sql: 'INSERT INTO user VALUES (?, ?, ?, ?, ?)',
        args: [id, `Customer ${index}`, `customer${index}@example.test`, index % 2, index],
      })
    }
    await db.execute("INSERT INTO account_membership VALUES ('a', 'user_26'), ('b', 'user_26')")

    const first = await listCustomers(db, '', 1)
    const second = await listCustomers(db, '', 2)
    assert.equal(first.customers.length, 25)
    assert.equal(first.hasMore, true)
    assert.equal(first.customers[0].id, 'user_26')
    assert.equal(first.customers[0].accountCount, 2)
    assert.deepEqual(
      second.customers.map((customer) => customer.id),
      ['user_01', 'user_00'],
    )
    assert.equal(second.hasMore, false)
    assert.equal(
      new Set([...first.customers, ...second.customers].map((customer) => customer.id)).size,
      27,
    )

    const filtered = await listCustomers(db, 'CUSTOMER26@EXAMPLE.TEST', 1)
    assert.deepEqual(
      filtered.customers.map((customer) => customer.id),
      ['user_26'],
    )
    assert.deepEqual((await listCustomers(db, "' OR 1=1 --", 1)).customers, [])
  } finally {
    db.close()
  }
})
