import test from 'node:test'
import assert from 'node:assert/strict'
import earlyAccess from '../netlify/functions/early-access.mjs'

const endpoint = 'https://matterdraft.legal/.netlify/functions/early-access'
const validBody = {
  name: 'Asha Rao',
  email: 'asha@example.com',
  role: 'Advocate',
  platform: 'Windows',
  contactConsent: true,
  website: '',
}

function request(body = validBody) {
  return new Request(endpoint, { method: 'POST', body: JSON.stringify(body) })
}

test('early access rejects invalid input before contacting the Sheet', async () => {
  const originalUrl = process.env.EARLY_ACCESS_GOOGLE_SHEETS_URL
  const originalSecret = process.env.EARLY_ACCESS_GOOGLE_SHEETS_SECRET
  const originalFetch = globalThis.fetch
  process.env.EARLY_ACCESS_GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/test-id/exec'
  process.env.EARLY_ACCESS_GOOGLE_SHEETS_SECRET = 'a'.repeat(32)
  globalThis.fetch = () => {
    throw new Error('Unexpected webhook call')
  }
  try {
    assert.equal(
      (await earlyAccess(request({ ...validBody, name: '=HYPERLINK("x")' }))).status,
      400,
    )
    assert.equal((await earlyAccess(request({ ...validBody, contactConsent: false }))).status, 400)
    assert.equal((await earlyAccess(request({ ...validBody, platform: 'Linux' }))).status, 400)
    const availability = await earlyAccess(new Request(endpoint))
    assert.equal(availability.headers.get('cache-control'), 'no-store')
    assert.deepEqual(await availability.json(), { enabled: true })
    assert.equal((await earlyAccess(new Request(endpoint, { method: 'PUT' }))).status, 405)
    delete process.env.EARLY_ACCESS_GOOGLE_SHEETS_URL
    assert.deepEqual(await (await earlyAccess(new Request(endpoint))).json(), { enabled: false })
    assert.equal((await earlyAccess(request())).status, 503)
  } finally {
    globalThis.fetch = originalFetch
    if (originalUrl === undefined) delete process.env.EARLY_ACCESS_GOOGLE_SHEETS_URL
    else process.env.EARLY_ACCESS_GOOGLE_SHEETS_URL = originalUrl
    if (originalSecret === undefined) delete process.env.EARLY_ACCESS_GOOGLE_SHEETS_SECRET
    else process.env.EARLY_ACCESS_GOOGLE_SHEETS_SECRET = originalSecret
  }
})

test('early access reports success only after the webhook confirms a write', async () => {
  const originalUrl = process.env.EARLY_ACCESS_GOOGLE_SHEETS_URL
  const originalSecret = process.env.EARLY_ACCESS_GOOGLE_SHEETS_SECRET
  const originalFetch = globalThis.fetch
  process.env.EARLY_ACCESS_GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/test-id/exec'
  process.env.EARLY_ACCESS_GOOGLE_SHEETS_SECRET = 'b'.repeat(32)
  let sent
  globalThis.fetch = async (_url, options) => {
    sent = JSON.parse(options.body)
    return Response.json({ success: true })
  }
  try {
    const success = await earlyAccess(request())
    assert.equal(success.status, 200)
    assert.equal((await success.json()).success, true)
    assert.equal(sent.email, validBody.email)
    assert.equal(sent.secret, 'b'.repeat(32))
    globalThis.fetch = async () => Response.json({ success: false })
    const failed = await earlyAccess(request())
    assert.equal(failed.status, 503)
    assert.equal((await failed.json()).success, false)
  } finally {
    globalThis.fetch = originalFetch
    if (originalUrl === undefined) delete process.env.EARLY_ACCESS_GOOGLE_SHEETS_URL
    else process.env.EARLY_ACCESS_GOOGLE_SHEETS_URL = originalUrl
    if (originalSecret === undefined) delete process.env.EARLY_ACCESS_GOOGLE_SHEETS_SECRET
    else process.env.EARLY_ACCESS_GOOGLE_SHEETS_SECRET = originalSecret
  }
})
