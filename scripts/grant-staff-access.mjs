import { createClient } from '@libsql/client'
import { randomUUID } from 'node:crypto'

process.loadEnvFile('.env')
const email = process.argv[2]?.trim().toLowerCase()
const reason = process.argv.slice(3).join(' ').trim()
if (!email || !reason) {
  console.error(
    'Usage: npm run staff:grant-access -- user@example.com "Reason for granting access"',
  )
  process.exit(2)
}
const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})
try {
  const userResult = await client.execute({
    sql: 'SELECT id, email_verified FROM user WHERE lower(email) = ? LIMIT 1',
    args: [email],
  })
  const user = userResult.rows[0]
  if (!user || !user.email_verified)
    throw new Error('A verified account with that email is required')
  const tx = await client.transaction('write')
  try {
    await tx.execute({
      sql: 'INSERT INTO staff_access (user_id, role, active, created_at) VALUES (?, ?, 1, ?) ON CONFLICT(user_id) DO UPDATE SET role = excluded.role, active = 1',
      args: [user.id, 'super_admin', Date.now()],
    })
    await tx.execute({
      sql: 'INSERT INTO audit_event (id, actor_user_id, event_type, subject_type, subject_id, event_detail, created_at) VALUES (?, NULL, ?, ?, ?, ?, ?)',
      args: [randomUUID(), 'staff.bootstrap', 'user', user.id, reason, Date.now()],
    })
    await tx.commit()
  } catch (error) {
    await tx.rollback()
    throw error
  }
  console.log('Super-admin capability granted to the verified account.')
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Staff grant failed')
  process.exitCode = 1
} finally {
  client.close()
}
