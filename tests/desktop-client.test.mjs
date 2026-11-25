import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'

const clientId = 'matterdraft-studio-desktop'
const migration = readFileSync('drizzle/0015_builtin_desktop_client.sql', 'utf8')

test('fresh portals provision a public native client and do not re-enable it on later migrations', async (t) => {
  const db = createClient({ url: 'file::memory:' })
  t.after(() => db.close())
  await migrate(drizzle(db), { migrationsFolder: './drizzle' })
  const { rows } = await db.execute({
    sql: 'SELECT * FROM oauth_client WHERE client_id = ?',
    args: [clientId],
  })
  assert.equal(rows.length, 1)
  const registration = rows[0]
  assert.equal(registration.client_secret, null)
  assert.equal(registration.user_id, null)
  assert.equal(registration.application_type, 'native')
  assert.equal(registration.token_endpoint_auth_method, 'none')
  assert.equal(registration.require_pkce, 1)
  assert.equal(registration.skip_consent, 0)
  assert.deepEqual(JSON.parse(registration.redirect_uris), [
    'legal.matterdraft.studio:/oauth/callback',
  ])
  assert.deepEqual(JSON.parse(registration.grant_types), ['authorization_code', 'refresh_token'])
  assert.deepEqual(JSON.parse(registration.scopes).sort(), [
    'email',
    'offline_access',
    'openid',
    'profile',
  ])
  const audit = await db.execute({
    sql: "SELECT * FROM audit_event WHERE subject_id = ? AND event_type = 'oauth_client.register'",
    args: [clientId],
  })
  assert.equal(audit.rows.length, 1)
  assert.equal(audit.rows[0].actor_user_id, null)
  await db.execute({
    sql: 'UPDATE oauth_client SET disabled = 1 WHERE client_id = ?',
    args: [clientId],
  })
  await migrate(drizzle(db), { migrationsFolder: './drizzle' })
  assert.equal((await db.execute('SELECT disabled FROM oauth_client')).rows[0].disabled, 1)
  assert.equal((await db.execute('SELECT * FROM audit_event')).rows.length, 1)
  assert.deepEqual((await db.execute('PRAGMA foreign_key_check')).rows, [])
})

test('upgrading preserves earlier desktop registrations and fails on a conflicting built-in ID', async (t) => {
  const db = createClient({ url: 'file::memory:' })
  t.after(() => db.close())
  const journal = JSON.parse(readFileSync('drizzle/meta/_journal.json', 'utf8'))
  for (const entry of journal.entries.filter((entry) => entry.idx < 15)) {
    await db.executeMultiple(readFileSync(`drizzle/${entry.tag}.sql`, 'utf8'))
  }
  await db.execute({
    sql: `INSERT INTO oauth_client (id, client_id, name, redirect_uris, application_type,
      token_endpoint_auth_method) VALUES ('legacy-row', 'legacy-public-id',
      'MatterDraft Studio Desktop', ?, 'native', 'none')`,
    args: [JSON.stringify(JSON.stringify(['legal.matterdraft.studio:/oauth/callback']))],
  })
  const previous = (await db.execute("SELECT * FROM oauth_client WHERE id = 'legacy-row'")).rows
  await db.executeMultiple(migration)
  assert.deepEqual(
    (await db.execute("SELECT * FROM oauth_client WHERE id = 'legacy-row'")).rows,
    previous,
  )
  assert.equal((await db.execute('SELECT * FROM oauth_client')).rows.length, 2)
  // A collision must not silently bless or replace an existing registration.
  await assert.rejects(db.executeMultiple(migration), /UNIQUE constraint/)
  assert.equal((await db.execute('SELECT * FROM audit_event')).rows.length, 1)
})
