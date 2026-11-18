import test from 'node:test'
import assert from 'node:assert/strict'

globalThis.defineEventHandler = (handler) => handler
globalThis.setHeader = (event, key, value) => {
  event.headers[key.toLowerCase()] = String(value)
}
globalThis.setResponseStatus = (event, status) => {
  event.status = status
}
const { applicationRoute, applicationFailure } =
  await import('../server/utils/application-error.ts')
const { parseApiError } = await import('../app/utils/api-error.ts')

const secret = 'token-secret-SQL-password-123'
async function exercise(status, thrown = () => applicationFailure(status)) {
  const event = { headers: {}, status: 200 }
  const entries = []
  const previousWarn = console.warn
  const previousError = console.error
  console.warn = (line) => entries.push(line)
  console.error = (line) => entries.push(line)
  try {
    const response = await applicationRoute('/api/accounts/[accountId]/overview', async () =>
      thrown(),
    )(event)
    return { event, response, log: JSON.parse(entries[0]), rawLog: entries.join('') }
  } finally {
    console.warn = previousWarn
    console.error = previousError
  }
}

for (const status of [401, 403, 404, 409, 422, 429, 500, 503]) {
  test(`safe ${status} response and matching log`, async () => {
    const result = await exercise(status)
    assert.equal(result.event.status, status)
    assert.match(result.response.error.requestId, /^req_[0-9a-f]{24}$/)
    assert.equal(result.event.headers['x-request-id'], result.response.error.requestId)
    assert.equal(result.log.requestId, result.response.error.requestId)
    assert.equal(result.log.status, status)
    assert.equal(result.log.route, '/api/accounts/[accountId]/overview')
    assert.equal(typeof result.log.durationMs, 'number')
    assert.deepEqual(Object.keys(result.response), ['error'])
  })
}

test('database exception does not disclose SQL or secrets', async () => {
  const error = new Error(`SELECT * FROM user WHERE password = '${secret}'`)
  error.name = 'LibsqlError'
  const result = await exercise(500, () => {
    throw error
  })
  assert.equal(result.event.status, 503)
  assert.equal(result.response.error.code, 'DEPENDENCY_UNAVAILABLE')
  assert.doesNotMatch(
    JSON.stringify(result.response) + result.rawLog,
    /SELECT|password|token-secret/,
  )
  assert.equal(result.log.exceptionType, 'LibsqlError')
})

test('unexpected exception and failed logger preserve safe response', async () => {
  const previous = console.error
  console.error = () => {
    throw new Error(secret)
  }
  try {
    const event = { headers: {}, status: 200 }
    const response = await applicationRoute('/api/portal/context', () => {
      throw new Error(secret)
    })(event)
    assert.equal(event.status, 500)
    assert.doesNotMatch(JSON.stringify(response), /token-secret/)
  } finally {
    console.error = previous
  }
})

test('client handles network, malformed HTML, rate limit and session expiry safely', () => {
  assert.match(parseApiError(new Error(secret)).text, /connection was interrupted/)
  assert.doesNotMatch(parseApiError({ status: 502, data: '<html>' }).text, /html|token-secret/)
  assert.match(
    parseApiError({
      status: 429,
      response: { status: 429, headers: new Headers({ 'retry-after': '42' }) },
    }).text,
    /42 seconds/,
  )
  assert.match(parseApiError({ status: 401 }).text, /Sign in/)
})
