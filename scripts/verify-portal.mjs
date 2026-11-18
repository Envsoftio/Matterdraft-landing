// Opt-in route/browser verification. Never points at a hosted database or sends SMTP.
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFile, readdir, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createClient } from '@libsql/client'

const origin = process.env.PORTAL_CHECK_URL || 'http://127.0.0.1:3012'
const database = process.env.PORTAL_CHECK_DATABASE || ''
assert.equal(new URL(origin).hostname, '127.0.0.1', 'Only a loopback server is permitted')
assert.match(database, /^file:\/private\/tmp\/.+\.db$/, 'Use a disposable /private/tmp database')
const db = createClient({ url: database })
// Also verify that the server has been started against THIS database, below.
const modulePath = process.env.PLAYWRIGHT_MODULE_PATH
const { chromium } = await import(modulePath ? pathToFileURL(modulePath).href : 'playwright')
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_EXECUTABLE ? { executablePath: process.env.CHROME_EXECUTABLE } : {}) })
const run = randomUUID().slice(0, 8)
const directory = resolve('/private/tmp', `matterdraft-portal-${run}`)
await mkdir(directory, { mode: 0o700 })
const password = `Disposable-${randomUUID()}!`
const evidence = []
const errorRequestIds = []
const browserErrors = []
const sensitiveTokens = []
const initialLog = process.env.PORTAL_CHECK_LOG ? await readFile(process.env.PORTAL_CHECK_LOG, 'utf8') : ''
const note = name => { evidence.push(name); console.log(`PASS ${name}`) }
const expect = async (check, message) => {
  const deadline = Date.now() + 5000
  while (!await check()) {
    assert.ok(Date.now() < deadline, message)
    await new Promise(resolve => setTimeout(resolve, 50))
  }
}
async function api(person, path, method = 'GET', data, status = 200, headers = {}) {
  const response = await person.context.request.fetch(`${origin}${path}`, { method, data, headers: { Origin: origin, ...headers }, failOnStatusCode: false })
  const routeName = path.split('?')[0].replace(/\/invitations\/[^/]+/, '/invitations/[token]')
  assert.ok((Array.isArray(status) ? status : [status]).includes(response.status()), `${method} ${routeName}: expected ${status}, received ${response.status()}`)
  const value = await response.json()
  if (response.status() >= 400 && !path.startsWith('/api/auth/')) {
    assert.match(value.error.requestId, /^req_[a-f0-9]{24}$/)
    assert.equal(response.headers()['x-request-id'], value.error.requestId)
    assert.deepEqual(Object.keys(value.error).sort(), ['code', 'message', 'requestId', 'retryable'])
    errorRequestIds.push(value.error.requestId)
    assert.doesNotMatch(JSON.stringify(value), /PRIVATE-[0-9a-f]{8}|support_ticket|support_message|stack|password/i)
  }
  return value
}
async function mail(email, subject) {
  const files = (await readdir('.data/mail-preview')).sort().reverse()
  for (const file of files) {
    const item = JSON.parse(await readFile(resolve('.data/mail-preview', file), 'utf8'))
    if (item.to === email && item.subject.includes(subject)) {
      assert.equal(new URL(item.url).origin, origin)
      const url = new URL(item.url)
      sensitiveTokens.push(url.searchParams.get('token') || url.pathname.split('/').pop())
      return item.url
    }
  }
  throw new Error(`No local ${subject} preview for this run`)
}
async function screen(person, path, name, width = 390) {
  await person.page.setViewportSize({ width, height: 844 })
  await person.page.goto(`${origin}${path}`)
  await hydrated(person.page)
  await person.page.locator('.portal, .portal-auth').waitFor()
  await person.page.evaluate(() => document.fonts.ready)
  await person.page.screenshot({ path: `${directory}/${name}-${width}.png`, fullPage: true })
  assert.ok(await person.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Page overflow: ${name}`)
}
async function hydrated(page) { await page.waitForFunction(() => document.querySelector('#__nuxt')?.__vue_app__?.$nuxt?.isHydrating === false) }
async function signIn(person) {
  await person.page.goto(`${origin}/sign-in`)
  await hydrated(person.page)
  await person.page.getByLabel('Email address').fill(person.email)
  await person.page.getByLabel('Password', { exact: true }).fill(password)
  await person.page.getByLabel('Password', { exact: true }).press('Enter')
  try { await person.page.waitForURL('**/portal', { timeout: 15000 }) }
  catch (error) {
    await person.page.screenshot({ path: `${directory}/signin-failure.png`, fullPage: true })
    console.log('Signin failure', person.page.url(), await person.page.getByRole('alert').allTextContents())
    throw error
  }
}
async function person(name, ui = false) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()
  page.on('pageerror', error => browserErrors.push(error.name))
  page.on('console', message => { if (/hydration.*mismatch/i.test(message.text())) browserErrors.push('HydrationMismatch') })
  const result = { context, page, name, email: `${name.toLowerCase()}-${run}@example.test` }
  if (ui) {
    await screen(result, '/sign-up', 'sign-up')
    await page.getByLabel('Full name').fill(name)
    await page.getByLabel('Email address').fill(result.email)
    await page.getByLabel('Password', { exact: true }).fill(password)
    await page.getByRole('button', { name: 'Create account', exact: true }).click()
    await page.waitForURL('**/verify-email?**')
    await page.getByRole('button', { name: 'Resend verification link' }).click()
    await page.getByRole('status').waitFor()
  } else await api(result, '/api/auth/sign-up/email', 'POST', { name, email: result.email, password })
  // Assert DB identity before any fixture updates; this proves server/database isolation.
  const record = await db.execute({ sql: 'SELECT id FROM user WHERE email = ?', args: [result.email] })
  assert.equal(record.rows.length, 1, 'Server and verification database differ')
  result.id = String(record.rows[0].id)
  await api(result, '/api/auth/sign-in/email', 'POST', { email: result.email, password }, 403)
  await page.goto(await mail(result.email, 'Verify'))
  await hydrated(page)
  await signIn(result)
  result.accounts = (await api(result, '/api/portal/context')).accounts
  return result
}
async function invite(owner, recipient, accountId, role = 'member') {
  const path = `/api/membership/accounts/${accountId}/invitations`
  await api(owner, path, 'POST', { email: recipient.email, role })
  return new URL(await mail(recipient.email, 'Invitation')).pathname.split('/').pop()
}
try {
  const owner = await person('Owner', true)
  const peer = await person('Peer')
  const admin = await person('Admin')
  const outsider = await person('Outsider')
  const staff = await person('Staff')
  const unverified = await person('Unverified')
  await db.execute({ sql: 'UPDATE user SET email_verified = 0 WHERE id = ?', args: [unverified.id] })
  await api(unverified, '/api/portal/context', 'GET', undefined, 403)
  note('UI signup, local verification/resend, verified signin; unverified signin and session denial')

  await screen(owner, '/portal', 'accounts')
  await owner.page.getByLabel('Organisation name').fill(`Verification ${run}`)
  await owner.page.getByRole('button', { name: 'Create organisation' }).click()
  await owner.page.waitForURL('**/members')
  const accountId = owner.page.url().split('/')[4]
  const memberPath = `/api/membership/accounts/${accountId}`
  const tickets = `/api/accounts/${accountId}/tickets`
  await owner.page.getByLabel('Email address').fill(peer.email)
  await owner.page.getByRole('button', { name: 'Send invitation' }).click()
  await owner.page.getByRole('status').waitFor()
  const token = new URL(await mail(peer.email, 'Invitation')).pathname.split('/').pop()
  await api(outsider, `/api/membership/invitations/${token}`, 'GET', undefined, 404)
  await api(outsider, `/api/membership/invitations/${token}`, 'POST', undefined, 404)
  await peer.page.goto(`${origin}/invite/${token}`)
  await hydrated(peer.page)
  await peer.page.getByRole('button', { name: 'Accept invitation' }).click()
  await peer.page.getByText('You joined this organisation.').waitFor()
  const repeated = await Promise.all([api(peer, `/api/membership/invitations/${token}`, 'POST'), api(peer, `/api/membership/invitations/${token}`, 'POST')])
  assert.ok(repeated.every(r => r.invitationStatus === 'accepted'))
  assert.equal((await db.execute({ sql: 'SELECT COUNT(*) n FROM account_membership WHERE account_id = ? AND user_id = ?', args: [accountId, peer.id] })).rows[0].n, 1)
  const adminToken = await invite(owner, admin, accountId, 'admin')
  await api(admin, `/api/membership/invitations/${adminToken}`, 'POST')
  const duplicate = await Promise.all([
    api(owner, `${memberPath}/invitations`, 'POST', { email: outsider.email, role: 'member' }, [200, 409]),
    api(owner, `${memberPath}/invitations`, 'POST', { email: outsider.email, role: 'member' }, [200, 409]),
  ])
  // Arrival order is unspecified: inspect database rather than depending on the winner.
  assert.equal((await db.execute({ sql: "SELECT COUNT(*) n FROM organisation_invitation WHERE account_id = ? AND invitee_email = ? AND invitation_status = 'pending'", args: [accountId, outsider.email] })).rows[0].n, 1)
  assert.ok(duplicate.some(r => r.invitationId))
  const concurrentToken = new URL(await mail(outsider.email, 'Invitation')).pathname.split('/').pop()
  const accepted = await Promise.all([api(outsider, `/api/membership/invitations/${concurrentToken}`, 'POST'), api(outsider, `/api/membership/invitations/${concurrentToken}`, 'POST')])
  assert.ok(accepted.every(r => r.invitationStatus === 'accepted'))
  assert.equal((await db.execute({ sql: 'SELECT COUNT(*) n FROM account_membership WHERE account_id = ? AND user_id = ?', args: [accountId, outsider.id] })).rows[0].n, 1)
  await screen(owner, `/a/${accountId}/members`, 'role-review')
  for (const role of ['billing_manager', 'admin']) {
    await owner.page.getByRole('row').filter({ hasText: outsider.email }).getByRole('button', { name: 'Review' }).click()
    await owner.page.getByLabel('New role').click()
    await owner.page.getByRole('option', { name: role.charAt(0).toUpperCase() + role.slice(1).replaceAll('_', ' '), exact: true }).click()
    await owner.page.getByRole('button', { name: 'Save role' }).click()
    await owner.page.getByRole('dialog').waitFor({ state: 'hidden' })
    await expect(async () => (await api(owner, `${memberPath}/members`)).members.find(m => m.user_id === outsider.id).role === role, 'Role update must be committed')
  }
  await api(admin, `${memberPath}/members/${outsider.id}`, 'PATCH', { role: 'member' }, 403)
  await api(admin, `${memberPath}/members/${outsider.id}`, 'DELETE', undefined, 403)
  await api(owner, `${memberPath}/members/${outsider.id}`, 'PATCH', { role: 'member' })
  note('Organisation and invitation UI, email binding, retry/concurrent invitation creation and acceptance')

  for (const role of ['owner', 'admin', 'billing_manager']) await api(admin, `${memberPath}/invitations`, 'POST', { email: `forge-${role}-${run}@example.test`, role }, 422)
  await api(admin, `${memberPath}/members/${owner.id}`, 'DELETE', undefined, 403)
  await api(admin, `${memberPath}/members/${admin.id}`, 'DELETE', undefined, 403)
  await api(admin, `${memberPath}/members/${owner.id}`, 'PATCH', { role: 'member' }, 403)
  await api(admin, `${memberPath}/members/${peer.id}`, 'PATCH', { role: 'owner' }, 403)
  await api(owner, `${memberPath}/members/${owner.id}`, 'PATCH', { role: 'admin' }, 409)
  await api(owner, `${memberPath}/members/${owner.id}`, 'DELETE', undefined, 409)
  await api(peer, `${memberPath}/members`, 'GET', undefined, 403)
  await api(peer, `${memberPath}/transfers`, 'POST', { userId: admin.id }, 403)
  note('Direct API last-owner, member management and privilege escalation denials')

  await screen(owner, `/a/${accountId}/tickets`, 'customer-tickets')
  const marker = `PRIVATE-${run}-<script>window.ticketExecuted=true</script>`
  await owner.page.getByLabel('Subject', { exact: true }).fill(`Support ${run}`)
  await owner.page.getByLabel('Description').fill(marker)
  await owner.page.getByRole('button', { name: 'Send ticket', exact: true }).click()
  await owner.page.waitForURL(/\/tickets\/[^/]+$/)
  const ticketId = owner.page.url().split('/').pop()
  await owner.page.getByLabel('Reply', { exact: true }).fill(`Customer ${marker}`)
  await owner.page.getByRole('button', { name: 'Send reply' }).click()
  await owner.page.getByText(`Customer ${marker}`, { exact: true }).waitFor()
  assert.equal(await owner.page.evaluate(() => window.ticketExecuted), undefined)
  await api(peer, `${tickets}/${ticketId}`, 'GET', undefined, 404)
  await api(peer, `${tickets}/${ticketId}/replies`, 'POST', { body: 'forged', submissionKey: randomUUID() }, 404)
  await screen(peer, `/a/${accountId}/tickets/${ticketId}`, 'peer-denied')
  assert.ok(!(await peer.page.content()).includes(marker))
  assert.equal((await api(peer, tickets)).tickets.length, 0)
  await api(outsider, `/api/accounts/${owner.accounts[0].id}/tickets`, 'GET', undefined, 404)
  await api(owner, `/api/accounts/${owner.accounts[0].id}/tickets/${ticketId}`, 'GET', undefined, 404)
  await api(unverified, tickets, 'GET', undefined, 403)
  const input = { category: 'bug', subject: `Concurrent ${run}`, body: marker, submissionKey: randomUUID() }
  const creations = await Promise.all([api(owner, tickets, 'POST', input), api(owner, tickets, 'POST', input)])
  assert.equal(creations[0].ticketId, creations[1].ticketId)
  const reply = { body: `Concurrent ${marker}`, submissionKey: randomUUID() }
  const replies = await Promise.all([api(owner, `${tickets}/${ticketId}/replies`, 'POST', reply), api(owner, `${tickets}/${ticketId}/replies`, 'POST', reply)])
  assert.equal(replies[0].messageId, replies[1].messageId)
  await api(owner, `${tickets}/${ticketId}/replies`, 'POST', { ...reply, body: 'changed' }, 409)
  await api(owner, tickets, 'POST', { ...input, body: 'x'.repeat(10001), submissionKey: randomUUID() }, 422)
  await api(owner, tickets, 'POST', { ...input, extra: 'x'.repeat(50000) }, 422)
  await api(owner, tickets, 'POST', '{invalid', 400, { 'Content-Type': 'application/json' })
  await api(owner, tickets, 'POST', { ...input, submissionKey: randomUUID() }, 403, { Origin: 'https://other.example.test' })
  await api(owner, `${tickets}/${ticketId}/replies`, 'POST', { ...reply, submissionKey: randomUUID() }, 403, { Origin: '' })
  note('Customer ticket/reply UI, inert HTML text, account/peer/unverified denials, concurrent idempotency')

  const internalPaths = ['/api/internal/overview', '/api/internal/customers', '/api/internal/organisations', '/api/internal/tickets', `/api/internal/tickets/${ticketId}`, '/api/internal/desktop-client']
  for (const path of internalPaths) await api(staff, path, 'GET', undefined, 403)
  await db.execute({ sql: "INSERT INTO staff_access (user_id, role, active, created_at) VALUES (?, 'super_admin', 1, ?)", args: [staff.id, Date.now()] })
  await db.execute({ sql: 'UPDATE user SET email_verified = 0 WHERE id = ?', args: [staff.id] })
  await api(staff, '/api/internal/tickets', 'GET', undefined, 403)
  await db.execute({ sql: 'UPDATE user SET email_verified = 1 WHERE id = ?', args: [staff.id] })
  await screen(staff, '/internal/tickets', 'staff-tickets')
  await staff.page.getByRole('link', { name: `Support ${run}`, exact: true }).click()
  await staff.page.getByLabel('Reply', { exact: true }).fill(`Staff ${marker}`)
  await staff.page.getByRole('button', { name: 'Send reply' }).click()
  await staff.page.getByText(`Staff ${marker}`, { exact: true }).waitFor()
  await staff.page.getByLabel('Status', { exact: true }).click()
  await staff.page.getByRole('option', { name: 'Resolved', exact: true }).click()
  await staff.page.getByRole('button', { name: 'Update status' }).click()
  await staff.page.getByText('This ticket is resolved. Replies are unavailable.').waitFor()
  for (const status of ['open', 'awaiting_support', 'awaiting_customer', 'resolved', 'closed']) await api(staff, `/api/internal/tickets/${ticketId}/status`, 'PATCH', { status })
  await api(owner, `${tickets}/${ticketId}/replies`, 'POST', { body: 'closed', submissionKey: randomUUID() }, 409)
  const customer = await api(owner, `${tickets}/${ticketId}`)
  assert.doesNotMatch(JSON.stringify(customer), /creatorEmail|accountName|authorUserId|author_user_id|creation_key|token_hash/)
  assert.ok(customer.messages.filter(m => m.authorType === 'staff').every(m => m.submissionKey === null))
  await db.execute({ sql: 'UPDATE staff_access SET active = 0 WHERE user_id = ?', args: [staff.id] })
  for (const path of internalPaths) await api(staff, path, 'GET', undefined, 403)
  await api(staff, `/api/internal/tickets/${ticketId}/replies`, 'POST', { body: 'revoked', submissionKey: randomUUID() }, 403)
  await api(staff, `/api/internal/tickets/${ticketId}/status`, 'PATCH', { status: 'open' }, 403)
  await screen(staff, '/internal/tickets', 'revoked-staff')
  await staff.page.getByRole('alert').waitFor()
  assert.ok(!(await staff.page.content()).includes(marker))
  await db.execute({ sql: "UPDATE staff_access SET active = 1, role = 'support_operator' WHERE user_id = ?", args: [staff.id] })
  await api(staff, '/api/internal/tickets', 'GET', undefined, 403)
  await db.execute({ sql: "UPDATE staff_access SET role = 'super_admin' WHERE user_id = ?", args: [staff.id] })
  await api(staff, `/api/internal/tickets/${ticketId}/replies`, 'POST', { body: 'origin denied', submissionKey: randomUUID() }, 403, { Origin: 'https://other.example.test' })
  await api(staff, `/api/internal/tickets/${ticketId}/status`, 'PATCH', { status: 'open' }, 403, { Origin: '' })
  const audit = await db.execute({ sql: "SELECT event_type, event_detail FROM audit_event WHERE actor_user_id = ? AND event_type LIKE 'staff.ticket%'", args: [staff.id] })
  assert.ok(audit.rows.some(r => r.event_type === 'staff.ticket_replied'))
  assert.ok(audit.rows.some(r => r.event_type === 'staff.ticket_status_changed'))
  assert.ok(audit.rows.every(r => r.event_detail === r.event_type))
  note('Staff ticket read/reply/status UI, five statuses, revocation/wrong-role denial, customer metadata privacy and audits')

  const peerTicket = await api(peer, tickets, 'POST', { ...input, submissionKey: randomUUID() })
  await api(owner, `${memberPath}/members/${peer.id}`, 'DELETE')
  for (const path of [tickets, `${tickets}/${peerTicket.ticketId}`, `${memberPath}/members`, `/api/accounts/${accountId}/overview`]) await api(peer, path, 'GET', undefined, 404)
  await api(peer, `${tickets}/${peerTicket.ticketId}/replies`, 'POST', { body: 'removed', submissionKey: randomUUID() }, 404)
  await api(peer, tickets, 'POST', { ...input, submissionKey: randomUUID() }, 404)
  const expiredToken = await invite(owner, peer, accountId)
  await db.execute({ sql: "UPDATE organisation_invitation SET expires_at = ? WHERE account_id = ? AND invitee_email = ? AND invitation_status = 'pending'", args: [Date.now() - 1000, accountId, peer.email] })
  await api(peer, `/api/membership/invitations/${expiredToken}`, 'POST', undefined, 409)
  const revokedToken = await invite(owner, peer, accountId)
  const pending = (await api(owner, `${memberPath}/members`)).invitations.find(i => i.invitee_email === peer.email && i.invitation_status === 'pending')
  await api(owner, `${memberPath}/invitations/${pending.id}/revoke`, 'POST')
  await api(peer, `/api/membership/invitations/${revokedToken}`, 'POST', undefined, 409)
  await db.execute({ sql: 'UPDATE session SET created_at = ? WHERE user_id = ?', args: [Date.now() - 660000, owner.id] })
  await api(owner, `${memberPath}/transfers`, 'POST', { userId: admin.id }, 403)
  await signIn(owner)
  await api(owner, `${memberPath}/transfers`, 'POST', { userId: admin.id })
  const transfer = new URL(await mail(admin.email, 'Ownership transfer')).pathname.split('/').pop()
  await db.execute({ sql: 'UPDATE session SET created_at = ? WHERE user_id = ?', args: [Date.now() - 660000, admin.id] })
  await api(admin, `/api/membership/invitations/${transfer}`, 'POST', undefined, 403)
  await signIn(admin)
  await admin.page.goto(`${origin}/invite/${transfer}`)
  await hydrated(admin.page)
  await admin.page.getByRole('button', { name: 'Accept invitation' }).click()
  await admin.page.getByText('You now own this organisation.').waitFor()
  await api(admin, `/api/membership/invitations/${transfer}`, 'POST')
  const roles = await api(admin, `${memberPath}/members`)
  assert.equal(roles.members.find(m => m.user_id === admin.id).role, 'owner')
  assert.equal(roles.members.find(m => m.user_id === owner.id).role, 'admin')
  note('Removed-member denial; stale initiator/recipient transfer denial; ownership acceptance UI and retry')

  await screen(owner, '/forgot-password', 'recovery')
  await owner.page.getByLabel('Email address').fill(owner.email)
  await owner.page.getByRole('button', { name: 'Send reset link' }).click()
  await owner.page.getByRole('status').waitFor()
  const reset = await mail(owner.email, 'Reset your')
  await owner.page.goto(reset)
  await hydrated(owner.page)
  await owner.page.getByLabel('New password').fill(password)
  await owner.page.getByRole('button', { name: 'Save new password' }).click()
  await owner.page.getByRole('status').waitFor()
  await api(owner, '/api/auth/reset-password', 'POST', { token: new URL(owner.page.url()).searchParams.get('token'), newPassword: password }, 400)
  await signIn(owner)
  await api(outsider, '/api/auth/request-password-reset', 'POST', { email: `absent-${run}@example.test`, redirectTo: `${origin}/reset-password` })
  await owner.page.getByRole('button', { name: 'Profile for Owner' }).click()
  await owner.page.getByRole('menuitem', { name: 'Sign out' }).click()
  await owner.page.waitForURL('**/sign-in')
  await api(owner, '/api/portal/context', 'GET', undefined, 401)
  await api(owner, tickets, 'GET', undefined, 401)
  await api(owner, '/api/internal/tickets', 'GET', undefined, 401)
  await signIn(owner)
  note('Recovery UI, reset-token single use, non-enumerating absent-user response and signout/session denial')

  // Simulate a lost response AFTER a real mutation commits, then a failed reconciliation read.
  const unavailable = { status: 503, contentType: 'application/json', body: JSON.stringify({ error: { code: 'DEPENDENCY_UNAVAILABLE' } }) }
  await screen(owner, `/a/${accountId}/tickets`, 'ticket-before-uncertain')
  let creationPayload
  await owner.page.route(`**${tickets}`, async route => {
    if (route.request().method() === 'POST') { creationPayload = route.request().postDataJSON(); await route.fetch(); await route.fulfill(unavailable) }
    else await route.continue()
  })
  await owner.page.getByLabel('Subject', { exact: true }).fill(`Uncertain ${run}`)
  await owner.page.getByLabel('Description').fill(marker)
  await owner.page.getByRole('button', { name: 'Send ticket', exact: true }).click()
  await owner.page.getByRole('button', { name: 'Check tickets' }).waitFor()
  await expect(() => owner.page.getByRole('button', { name: 'Send ticket', exact: true }).isDisabled(), 'Uncertain creation must be blocked')
  await owner.page.unroute(`**${tickets}`)
  await owner.page.route(`**${tickets}*`, route => route.fulfill(unavailable))
  await owner.page.getByRole('button', { name: 'Check tickets' }).click()
  await owner.page.getByRole('button', { name: 'Try again', exact: true }).waitFor()
  await expect(() => owner.page.getByRole('button', { name: 'Send ticket', exact: true }).isDisabled(), 'Failed reconciliation must remain blocked')
  await owner.page.unroute(`**${tickets}*`)
  await owner.page.getByRole('button', { name: 'Check tickets' }).click()
  await owner.page.getByRole('button', { name: 'Send ticket', exact: true }).click()
  await owner.page.waitForURL(/\/tickets\/[^/]+$/)
  assert.equal((await db.execute({ sql: 'SELECT COUNT(*) n FROM support_ticket WHERE creation_key = ?', args: [creationPayload.submissionKey] })).rows[0].n, 1)
  const uncertainTicket = owner.page.url().split('/').pop()
  let replyPayload
  await owner.page.route(`**${tickets}/${uncertainTicket}/replies`, async route => { replyPayload = route.request().postDataJSON(); await route.fetch(); await route.fulfill(unavailable) })
  await owner.page.getByLabel('Reply', { exact: true }).fill(`Lost ${marker}`)
  await owner.page.getByRole('button', { name: 'Send reply' }).click()
  await owner.page.getByRole('button', { name: 'Check conversation' }).waitFor()
  await owner.page.route(`**${tickets}/${uncertainTicket}`, route => route.fulfill(unavailable))
  await owner.page.getByRole('button', { name: 'Check conversation' }).click()
  await owner.page.getByRole('heading', { name: 'Ticket unavailable' }).waitFor()
  await owner.page.unroute(`**${tickets}/${uncertainTicket}`)
  await owner.page.getByRole('button', { name: 'Try again', exact: true }).click()
  await owner.page.getByRole('button', { name: 'Check conversation' }).click()
  await expect(async () => await owner.page.getByLabel('Reply', { exact: true }).inputValue() === '', 'Committed reply must reconcile')
  assert.equal((await db.execute({ sql: 'SELECT COUNT(*) n FROM support_message WHERE submission_key = ?', args: [replyPayload.submissionKey] })).rows[0].n, 1)
  await owner.page.unrouteAll()
  note('Lost committed ticket/reply responses and failed reconciliation keep submissions blocked; same-key recovery leaves one row')

  for (const [path, endpoint, label, button] of [
    ['/forgot-password', 'request-password-reset', 'Email address', 'Send reset link'],
    [`/verify-email?email=${owner.email}`, 'send-verification-email', 'Email address', 'Resend verification link'],
    ['/reset-password?token=invalid', 'reset-password', 'New password', 'Save new password'],
  ]) {
    await screen(owner, path, endpoint)
    await owner.page.route(`**/api/auth/${endpoint}`, route => route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"Unavailable"}' }))
    await owner.page.getByLabel(label, { exact: true }).fill(label === 'New password' ? password : owner.email)
    await owner.page.getByRole('button', { name: button }).click()
    await owner.page.getByRole('alert').waitFor()
    assert.equal(await owner.page.getByRole('status').count(), 0)
    assert.equal(await owner.page.getByRole('button', { name: button }).isEnabled(), true)
    await owner.page.unrouteAll()
  }
  note('Recovery, verification resend and reset failures show accessible errors and release busy state')

  await screen(owner, '/portal', 'navigation-keyboard')
  await owner.page.keyboard.press('Tab')
  assert.equal(await owner.page.locator(':focus').textContent(), 'Skip to content')
  await owner.page.keyboard.press('Tab')
  assert.equal(await owner.page.locator(':focus').getAttribute('aria-label'), 'Open navigation')
  await owner.page.keyboard.press('Enter')
  for (let i = 0; i < 18; i++) {
    await owner.page.keyboard.press('Tab')
    assert.ok(await owner.page.evaluate(() => document.querySelector('#portal-navigation').contains(document.activeElement)))
  }
  await owner.page.keyboard.press('Escape')
  assert.equal(await owner.page.locator(':focus').getAttribute('aria-label'), 'Open navigation')
  await screen(admin, `/a/${accountId}/members`, 'members')
  const review = admin.page.getByRole('row').filter({ hasText: owner.email }).getByRole('button', { name: 'Review' })
  await review.focus(); await admin.page.keyboard.press('Enter')
  await admin.page.getByRole('dialog').waitFor()
  for (let i = 0; i < 12; i++) {
    await admin.page.keyboard.press('Tab')
    assert.ok(await admin.page.evaluate(() => document.querySelector('[role="dialog"]').contains(document.activeElement)))
  }
  await admin.page.screenshot({ path: `${directory}/member-dialog-390.png`, fullPage: true })
  await admin.page.keyboard.press('Escape')
  await admin.page.getByRole('dialog').waitFor({ state: 'hidden' })
  assert.equal(await review.evaluate(el => el === document.activeElement), true)
  await screen(owner, '/portal', 'account-switch-desktop', 1280)
  await owner.page.getByRole('button', { name: 'Switch account' }).focus()
  await owner.page.keyboard.press('Enter')
  await owner.page.keyboard.press('v')
  await owner.page.getByRole('menuitem').filter({ hasText: `Verification ${run}` }).focus()
  await owner.page.keyboard.press('Enter')
  await owner.page.waitForURL(`**/a/${accountId}/overview`)
  await screen(owner, `/a/${accountId}/tickets`, 'draft-before-switch', 1280)
  await owner.page.getByLabel('Subject', { exact: true }).fill('Draft in organisation')
  await owner.page.getByRole('link', { name: owner.accounts[0].name, exact: true }).click()
  await owner.page.waitForURL(`**/a/${owner.accounts[0].id}/overview`)
  await expect(async () => await owner.page.getByRole('link', { name: 'Support', exact: true }).getAttribute('href') === `/a/${owner.accounts[0].id}/tickets`, 'Support link must match the selected account')
  await owner.page.getByRole('link', { name: 'Support', exact: true }).click()
  await owner.page.waitForURL(`**/a/${owner.accounts[0].id}/tickets`)
  await expect(async () => await owner.page.getByLabel('Subject', { exact: true }).inputValue() === '', 'Account switching must reset the ticket draft')
  note('Keyboard navigation, mobile focus trap/Escape, member dialog focus/return, account switching and draft reset')

  await owner.page.route('**/api/auth/sign-out', route => route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"Unavailable"}' }))
  await owner.page.getByRole('button', { name: 'Profile for Owner' }).click()
  await owner.page.getByRole('menuitem', { name: 'Sign out' }).click()
  await owner.page.getByRole('alert').waitFor()
  assert.ok(!owner.page.url().endsWith('/sign-in'))
  await owner.page.unrouteAll()
  await api(owner, '/api/portal/context')
  for (let i = 0; i < 10; i++) await api(outsider, '/api/membership/organisations', 'POST', { name: `Rate check ${run} ${i}` })
  await api(outsider, '/api/membership/organisations', 'POST', { name: 'Over limit' }, 429)
  note('Signout failure retains visible session state; real organisation rate limit returns safe 429')

  await db.execute('ALTER TABLE support_message RENAME TO support_message_verification_unavailable')
  try { await api(owner, `${tickets}/${ticketId}`, 'GET', undefined, 503) }
  finally { await db.execute('ALTER TABLE support_message_verification_unavailable RENAME TO support_message') }
  if (process.env.PORTAL_CHECK_LOG) {
    const log = (await readFile(process.env.PORTAL_CHECK_LOG, 'utf8')).slice(initialLog.length)
    assert.ok(!log.includes(marker), 'Ticket text leaked to runtime logs')
    assert.ok(!log.includes(password), 'Credential leaked to runtime logs')
    assert.ok(errorRequestIds.every(id => log.includes(id)), 'Error response/log request IDs must match')
    assert.ok(!log.includes('support_message_verification_unavailable'), 'SQL leaked to runtime logs')
    assert.ok(sensitiveTokens.every(token => !log.includes(token)), 'Invitation or auth token leaked to runtime logs')
    assert.doesNotMatch(log, /Hydration.*mismatch/i)
  }
  note('Real database-query failure returns redacted 503; matching request IDs; no ticket text, credentials, invitation/auth tokens, SQL or hydration warnings in captured logs')

  await screen(owner, `/a/${accountId}/members`, 'members')
  await screen(owner, `/a/${accountId}/activity`, 'activity')
  await screen(owner, `/a/${accountId}/tickets/${ticketId}`, 'customer-conversation')
  await screen(staff, `/internal/tickets/${ticketId}`, 'staff-conversation')
  await screen(staff, '/internal/customers', 'staff-customers')
  await screen(staff, '/internal/organisations', 'staff-organisations')
  await screen(owner, '/sign-in', 'sign-in')
  await screen(owner, '/verify-email', 'verify-email')
  await screen(owner, '/reset-password?token=invalid', 'reset-password')
  await screen(owner, '/portal', 'accounts-desktop', 1280)
  note('390px reflow screenshots for auth/customer/staff; 1280px accounts')
  assert.equal((await db.execute('PRAGMA foreign_key_check')).rows.length, 0)
  assert.deepEqual(browserErrors, [], 'Uncaught browser errors')
  console.log(`Artifacts: ${directory}`)
  console.log(`Completed ${evidence.length} verification groups`)
} finally {
  await browser.close()
  db.close()
}
