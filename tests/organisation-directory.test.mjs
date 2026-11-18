import test from 'node:test'
import assert from 'node:assert/strict'
import { createClient } from '@libsql/client'
import {
  listOrganisations,
  getOrganisationDetails,
} from '../server/utils/organisation-directory.ts'

test('organisation inspection searches, pages, scopes members and omits invitation tokens', async () => {
  const db = createClient({ url: 'file::memory:' })
  try {
    await db.execute(
      'CREATE TABLE customer_account (id TEXT PRIMARY KEY, name TEXT, account_type TEXT, created_at INTEGER)',
    )
    await db.execute('CREATE TABLE user (id TEXT PRIMARY KEY, name TEXT, email TEXT)')
    await db.execute(
      'CREATE TABLE account_membership (account_id TEXT, user_id TEXT, role TEXT, created_at INTEGER)',
    )
    await db.execute(
      'CREATE TABLE organisation_invitation (id TEXT, account_id TEXT, invitee_email TEXT, invited_role TEXT, invitation_type TEXT, invitation_status TEXT, expires_at INTEGER, created_at INTEGER, token_hash TEXT)',
    )
    for (let index = 0; index < 27; index++) {
      await db.execute({
        sql: 'INSERT INTO customer_account VALUES (?, ?, ?, ?)',
        args: [`org_${index}`, `Organisation ${index}`, 'organisation', index],
      })
    }
    await db.execute(
      "INSERT INTO customer_account VALUES ('personal', 'Personal', 'personal', 100)",
    )
    await db.execute(
      "INSERT INTO user VALUES ('u1', 'Owner One', 'one@example.test'), ('u2', 'Owner Two', 'two@example.test')",
    )
    await db.execute(
      "INSERT INTO account_membership VALUES ('org_26', 'u1', 'owner', 1), ('org_25', 'u2', 'owner', 2)",
    )
    await db.execute(
      "INSERT INTO organisation_invitation VALUES ('i1', 'org_26', 'invitee@example.test', 'owner', 'transfer', 'pending', 10, 1, 'private-token-hash')",
    )
    await db.execute(
      "INSERT INTO organisation_invitation VALUES ('i2', 'org_25', 'other@example.test', 'member', 'member', 'pending', 30, 1, 'other-private-token')",
    )

    const first = await listOrganisations(db, '', 1)
    const second = await listOrganisations(db, '', 2)
    assert.equal(first.organisations.length, 25)
    assert.equal(first.hasMore, true)
    assert.deepEqual(
      second.organisations.map((item) => item.id),
      ['org_1', 'org_0'],
    )
    assert.equal(second.hasMore, false)
    assert.equal(first.organisations[0].memberCount, 1)
    assert.deepEqual(
      (await listOrganisations(db, 'ORGANISATION 26', 1)).organisations.map((item) => item.id),
      ['org_26'],
    )
    assert.deepEqual((await listOrganisations(db, "' OR 1=1 --", 1)).organisations, [])

    const detail = await getOrganisationDetails(db, 'org_26', 20)
    assert.deepEqual(
      detail.members.map((member) => member.userId),
      ['u1'],
    )
    assert.equal(detail.invitations[0].status, 'expired')
    assert.equal(detail.invitations[0].type, 'transfer')
    assert.doesNotMatch(JSON.stringify(detail), /private-token|other@example/)
    assert.equal(await getOrganisationDetails(db, 'personal'), null)
    assert.equal(await getOrganisationDetails(db, 'missing'), null)
  } finally {
    db.close()
  }
})
