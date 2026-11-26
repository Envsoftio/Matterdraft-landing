// Opt-in checks against an isolated local portal, never a hosted database.
import assert from 'node:assert/strict'
import { createHash, generateKeyPairSync, randomBytes, randomUUID, sign, verify } from 'node:crypto'
import { createClient } from '@libsql/client'

const origin = process.env.PORTAL_CHECK_URL || 'http://127.0.0.1:3012'
const database = process.env.PORTAL_CHECK_DATABASE || ''
assert.equal(new URL(origin).hostname, '127.0.0.1')
assert.match(database, /^file:\/private\/tmp\/.+\.db$/)
const db = createClient({ url: database })
const clientId = 'matterdraft-studio-desktop'
const redirectUri = 'legal.matterdraft.studio:/oauth/callback'
const email = `desktop-${randomUUID()}@example.test`
const password = `Disposable-${randomUUID()}!`
let cookie = ''

async function call(path, { method = 'GET', body, form, session = true } = {}) {
  return fetch(new URL(path, origin), {
    method,
    redirect: 'manual',
    headers: {
      Origin: origin,
      Accept: 'application/json',
      ...(session && cookie ? { Cookie: cookie } : {}),
      ...(form ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: form ? new URLSearchParams(form) : body ? JSON.stringify(body) : undefined,
  })
}

function authorization(overrides = {}) {
  const verifier = randomBytes(32).toString('base64url')
  const state = randomUUID()
  return {
    verifier,
    state,
    query: new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid profile email offline_access',
      code_challenge: createHash('sha256').update(verifier).digest('base64url'),
      code_challenge_method: 'S256',
      state,
      prompt: 'consent',
      ...overrides,
    }),
  }
}

async function codeFor(overrides) {
  const attempt = authorization(overrides)
  const response = await call(`/api/auth/oauth2/authorize?${attempt.query}`)
  assert.equal(response.status, 200)
  const continuation = await response.json()
  assert.equal(continuation.redirect, true)
  const consent = new URL(continuation.url, origin)
  assert.equal(consent.origin, origin)
  assert.equal(consent.pathname, '/consent')
  const approval = await call('/api/auth/oauth2/consent', {
    method: 'POST',
    body: { accept: true, oauth_query: consent.search.slice(1) },
  })
  assert.equal(approval.status, 200)
  const callback = new URL((await approval.json()).url)
  assert.equal(callback.protocol + callback.pathname, redirectUri)
  assert.equal(callback.searchParams.get('state'), attempt.state)
  assert.ok(callback.searchParams.get('code'))
  return { ...attempt, code: callback.searchParams.get('code') }
}

async function exchange(attempt, overrides = {}) {
  return call('/api/auth/oauth2/token', {
    method: 'POST',
    session: false,
    form: {
      grant_type: 'authorization_code',
      client_id: clientId,
      redirect_uri: redirectUri,
      code: attempt.code,
      code_verifier: attempt.verifier,
      ...overrides,
    },
  })
}

try {
  const signup = await call('/api/auth/sign-up/email', {
    method: 'POST',
    body: { name: 'Desktop verification', email, password },
  })
  assert.equal(signup.status, 200)
  const user = (await db.execute({ sql: 'SELECT id FROM user WHERE email = ?', args: [email] }))
    .rows[0]
  assert.ok(user, 'The server must use this disposable database')
  await db.execute({ sql: 'UPDATE user SET email_verified = 1 WHERE id = ?', args: [user.id] })
  const login = await call('/api/auth/sign-in/email', {
    method: 'POST',
    body: { email, password },
  })
  assert.equal(login.status, 200)
  cookie = login.headers
    .getSetCookie()
    .map((item) => item.split(';')[0])
    .join('; ')
  assert.ok(cookie)

  // The dev app requests a fresh login even when the browser has a portal session.
  // Exercise the combined sign-in form's signed continuation through consent.
  const fresh = authorization({ prompt: 'login consent' })
  const freshAuthorization = await call(`/api/auth/oauth2/authorize?${fresh.query}`)
  assert.equal(freshAuthorization.status, 200)
  const signInUrl = new URL((await freshAuthorization.json()).url, origin)
  assert.equal(signInUrl.origin, origin)
  assert.equal(signInUrl.pathname, '/sign-in')
  const started = await call('/api/portal/desktop-sign-in' + signInUrl.search)
  assert.equal(started.status, 200)
  const start = (await started.json()).desktop
  assert.equal(start.freshLogin, true)
  assert.equal(start.state, fresh.state)
  const freshLogin = await call('/api/auth/sign-in/email', {
    method: 'POST',
    body: { email, password, oauth_query: start.signed },
  })
  assert.equal(freshLogin.status, 200)
  cookie = freshLogin.headers
    .getSetCookie()
    .map((item) => item.split(';')[0])
    .join('; ')
  const continuation = new URL((await freshLogin.json()).url, origin)
  assert.equal(continuation.origin, origin)
  assert.equal(continuation.pathname, '/consent')
  const continuedResponse = await call('/api/portal/desktop-sign-in' + continuation.search)
  const continued = (await continuedResponse.json()).desktop
  for (const key of ['clientId', 'state', 'redirectUri']) assert.equal(continued[key], start[key])
  const approval = await call('/api/auth/oauth2/consent', {
    method: 'POST',
    body: { accept: true, oauth_query: continued.signed },
  })
  assert.equal(approval.status, 200)
  const callback = new URL((await approval.json()).url)
  assert.equal(callback.protocol + callback.pathname, redirectUri)
  assert.equal(callback.searchParams.get('state'), fresh.state)
  assert.equal((await exchange({ ...fresh, code: callback.searchParams.get('code') })).status, 200)
  console.log('PASS fresh desktop sign-in continues through consent to a valid PKCE callback')

  // No super-admin registration call precedes the first authorization.
  const attempt = await codeFor()
  const tokenResponse = await exchange(attempt)
  assert.equal(tokenResponse.status, 200)
  const tokens = await tokenResponse.json()
  assert.ok(tokens.access_token && tokens.refresh_token)
  const profileResponse = await fetch(`${origin}/api/auth/oauth2/userinfo`, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
    redirect: 'manual',
  })
  assert.equal(profileResponse.status, 200)
  const profile = await profileResponse.json()
  assert.equal(profile.email, email)
  const personal = profile.matterdraft_accounts.find(
    (account) => account.accountType === 'personal',
  )
  assert.ok(personal)
  assert.deepEqual(profile.matterdraft_trials.expiries, {})
  const trialResponse = await call(`/api/accounts/${personal.id}/trial`, {
    method: 'POST',
    body: {},
  })
  assert.equal(trialResponse.status, 404)
  const trialProfileResponse = await fetch(`${origin}/api/auth/oauth2/userinfo`, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })
  assert.equal(trialProfileResponse.status, 200)
  assert.deepEqual((await trialProfileResponse.json()).matterdraft_trials.expiries, {})
  console.log('PASS migrated public client and retired portal trial-start route')

  if (process.env.PORTAL_CHECK_VAULT_RECOVERY === 'true') {
    const vaultId = randomBytes(32).toString('hex')
    const recoveryKey = randomBytes(32).toString('hex')
    const vaultRequest = (body, token = tokens.access_token) =>
      fetch(`${origin}/api/desktop/vault-recovery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ accountId: personal.id, vaultId, ...body }),
      })
    assert.equal((await vaultRequest({ action: 'save', recoveryKey }, '')).status, 401)
    const saved = await vaultRequest({ action: 'save', recoveryKey })
    assert.equal(saved.status, 200, await saved.clone().text())
    assert.deepEqual(await saved.json(), { saved: true })
    assert.equal((await vaultRequest({ action: 'recover', password: 'incorrect' })).status, 403)
    const recovered = await vaultRequest({ action: 'recover', password })
    assert.equal(recovered.status, 200, await recovered.clone().text())
    assert.match(recovered.headers.get('cache-control'), /no-store/)
    assert.equal((await recovered.json()).recoveryKey === recoveryKey, true)
    console.log('PASS desktop vault recovery requires the current account password')
  }

  const trialVerifyKey = process.env.PORTAL_CHECK_TRIAL_PUBLIC_KEY
  if (trialVerifyKey) {
    const device = generateKeyPairSync('ed25519')
    const publicKey = device.publicKey
      .export({ format: 'der', type: 'spki' })
      .subarray(-32)
      .toString('base64url')
    const requestTrial = (body, token = tokens.access_token) =>
      fetch(`${origin}/api/desktop/trial`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ accountId: personal.id, ...body }),
      })
    assert.equal((await requestTrial({ action: 'challenge', publicKey }, '')).status, 401)
    assert.equal(
      (await requestTrial({ action: 'challenge', publicKey }, 'invalid-token')).status,
      401,
    )
    const challenge = await requestTrial({ action: 'challenge', publicKey })
    assert.equal(challenge.status, 200, await challenge.clone().text())
    const { nonce } = await challenge.json()
    const proof = sign(
      null,
      Buffer.from(`matterdraft-desktop-trial-proof-v1:${nonce}`),
      device.privateKey,
    ).toString('base64url')
    const activation = await requestTrial({ action: 'activate', nonce, proof })
    assert.equal(activation.status, 200, await activation.clone().text())
    const { status, grant, expiresAt, serverTime } = await activation.json()
    assert.equal(status, 'active')
    assert.equal(expiresAt - serverTime, 7 * 24 * 60 * 60 * 1000)
    const updatedProfile = await fetch(`${origin}/api/auth/oauth2/userinfo`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    assert.equal(updatedProfile.status, 200)
    assert.equal((await updatedProfile.json()).matterdraft_trials.expiries[personal.id], expiresAt)
    const [header, payload, signature] = grant.split('.')
    assert.ok(
      verify(
        null,
        Buffer.from(`${header}.${payload}`),
        trialVerifyKey,
        Buffer.from(signature, 'base64url'),
      ),
    )
    assert.equal((await requestTrial({ action: 'activate', nonce, proof })).status, 403)
    console.log('PASS desktop OAuth routes issue a signed device-bound grant and reject replay')
  }

  const wrongVerifier = await exchange(await codeFor(), {
    code_verifier: randomBytes(32).toString('base64url'),
  })
  assert.equal(wrongVerifier.status, 400)
  const missingVerifier = await exchange(await codeFor(), { code_verifier: '' })
  assert.equal(missingVerifier.status, 400)
  const unknownClient = await exchange(await codeFor(), { client_id: 'unregistered-client' })
  assert.ok([400, 401].includes(unknownClient.status))
  for (const overrides of [
    { code_challenge: '', code_challenge_method: '' },
    { code_challenge_method: 'plain' },
    { redirect_uri: 'legal.matterdraft.studio:/other' },
    { redirect_uri: 'https://example.test/stolen' },
  ]) {
    const { query } = authorization(overrides)
    const response = await call(`/api/auth/oauth2/authorize?${query}`)
    const location =
      response.status === 200 ? (await response.json()).url : response.headers.get('location')
    if (location) {
      const target = new URL(location, origin)
      assert.notEqual(target.pathname, '/consent')
      assert.equal(
        target.hostname === 'example.test',
        false,
        'Never redirect to an unregistered host',
      )
      assert.equal(target.searchParams.has('code'), false)
      assert.equal(target.searchParams.has('error'), true)
    } else assert.ok(response.status >= 400)
  }
  console.log('PASS missing/wrong PKCE, unknown client, and unregistered callbacks are rejected')

  const refresh = await call('/api/auth/oauth2/token', {
    method: 'POST',
    session: false,
    form: { grant_type: 'refresh_token', client_id: clientId, refresh_token: tokens.refresh_token },
  })
  assert.equal(refresh.status, 200)
  const rotated = await refresh.json()
  assert.ok(rotated.access_token && rotated.refresh_token)
  assert.notEqual(rotated.refresh_token, tokens.refresh_token)
  await db.execute({
    sql: 'UPDATE oauth_client SET disabled = 1 WHERE client_id = ?',
    args: [clientId],
  })
  try {
    const response = await call('/api/auth/oauth2/token', {
      method: 'POST',
      session: false,
      form: {
        grant_type: 'refresh_token',
        client_id: clientId,
        refresh_token: rotated.refresh_token,
      },
    })
    assert.ok([400, 401, 403].includes(response.status))
  } finally {
    await db.execute({
      sql: 'UPDATE oauth_client SET disabled = 0 WHERE client_id = ?',
      args: [clientId],
    })
  }
  assert.equal((await exchange(attempt)).status, 400, 'Authorization codes are single-use')
  console.log('PASS refresh rotation, disabled-client rejection, and code replay rejection')

  await db.execute({
    sql: "INSERT INTO staff_access (user_id, role, active, created_at) VALUES (?, 'super_admin', 1, ?)",
    args: [user.id, Date.now()],
  })
  const status = await call('/api/internal/desktop-client')
  assert.equal(status.status, 200)
  assert.equal((await status.json()).clientId, clientId)
  const lookup = await call('/api/internal/desktop-client', { method: 'POST' })
  assert.equal(lookup.status, 200)
  assert.equal((await lookup.json()).created, false)
  const staffAttempt = authorization()
  staffAttempt.query.delete('prompt')
  assert.equal((await call(`/api/auth/oauth2/authorize?${staffAttempt.query}`)).status, 403)
  assert.deepEqual((await db.execute('PRAGMA foreign_key_check')).rows, [])
  console.log('PASS admin status/compatibility lookup and staff desktop sign-in rejection')
} finally {
  db.close()
}
