import { randomUUID } from 'node:crypto'
import { NO_INDEX } from '../scripts/discovery.mjs'

export function getEarlyAccessDestination(env = process.env) {
  const secret = env.EARLY_ACCESS_GOOGLE_SHEETS_SECRET?.trim()
  const address = env.EARLY_ACCESS_GOOGLE_SHEETS_URL?.trim()
  if (!secret || secret.length < 32 || !URL.canParse(address)) return null
  const url = new URL(address)
  if (
    url.origin !== 'https://script.google.com' ||
    url.username ||
    url.password ||
    !/^\/macros\/s\/[^/]+\/exec$/.test(url.pathname) ||
    url.search ||
    url.hash
  )
    return null
  return { url, secret }
}

const roles = new Set([
  '',
  'Advocate',
  'Barrister or solicitor',
  'Law firm or chambers team',
  'Paralegal or legal operations',
  'Other',
])
const platforms = new Set(['', 'Windows', 'macOS', 'Both'])

function json(status, data) {
  return Response.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': NO_INDEX },
  })
}

export default async function earlyAccess(request) {
  const destination = getEarlyAccessDestination()
  if (request.method === 'GET') return json(200, { enabled: Boolean(destination) })
  if (request.method !== 'POST') return json(405, { success: false })
  if (!destination) return json(503, { success: false })

  if (Number(request.headers.get('content-length') || 0) > 4096)
    return json(413, { success: false })
  let body
  try {
    const raw = await request.text()
    if (raw.length > 4096) return json(413, { success: false })
    body = JSON.parse(raw)
  } catch {
    return json(400, { success: false })
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return json(400, { success: false })
  if (body.website) return json(200, { success: true })

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const role = typeof body.role === 'string' ? body.role : ''
  const platform = typeof body.platform === 'string' ? body.platform : ''
  if (
    !name ||
    name.length > 120 ||
    /[\r\n\u0000-\u001f]/.test(name) ||
    !/^[\p{L}\p{M}]/u.test(name) ||
    email.length > 254 ||
    !/^[^\s@=+\-][^\s@]*@[^\s@.]+(?:\.[^\s@.]+)+$/.test(email) ||
    !roles.has(role) ||
    !platforms.has(platform) ||
    body.contactConsent !== true
  ) {
    return json(400, { success: false })
  }

  const now = new Date().toISOString()
  const record = {
    id: randomUUID(),
    submittedAt: now,
    name,
    email,
    role,
    platform,
    consentAt: now,
    source: '/',
  }
  try {
    const response = await fetch(destination.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...record, secret: destination.secret }),
      signal: AbortSignal.timeout(45000),
    })
    if (!response.ok || (await response.json()).success !== true)
      throw new Error('Sheet write not confirmed')
    return json(200, { success: true })
  } catch (error) {
    console.error('Early access Sheets webhook failed:', error)
    return json(503, { success: false })
  }
}
