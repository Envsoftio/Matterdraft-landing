import { randomBytes } from 'node:crypto'
import type { H3Event } from 'h3'

const catalogue = {
  BAD_REQUEST: { status: 400, message: 'We could not read this request. Check it and try again.', retryable: false },
  SIGN_IN_REQUIRED: { status: 401, message: 'Sign in to continue.', retryable: false },
  ACCESS_DENIED: { status: 403, message: 'You do not have access to this action.', retryable: false },
  NOT_FOUND: { status: 404, message: 'This item is unavailable.', retryable: false },
  CONFLICT: { status: 409, message: 'This has changed. Refresh and review the current state.', retryable: false },
  INVALID_INPUT: { status: 422, message: 'Check the information entered and try again.', retryable: false },
  RATE_LIMITED: { status: 429, message: 'Too many requests. Wait before trying again.', retryable: true },
  INTERNAL_ERROR: { status: 500, message: 'We could not complete this request. Try again later.', retryable: true },
  DEPENDENCY_UNAVAILABLE: { status: 503, message: 'This service is temporarily unavailable. Try again shortly.', retryable: true },
} as const

export type ApplicationErrorCode = keyof typeof catalogue
export class ApplicationError extends Error {
  readonly code: ApplicationErrorCode
  constructor(code: ApplicationErrorCode) { super(catalogue[code].message); this.code = code; this.name = 'ApplicationError' }
}

const byStatus: Record<number, ApplicationErrorCode> = {
  400: 'BAD_REQUEST', 401: 'SIGN_IN_REQUIRED', 403: 'ACCESS_DENIED', 404: 'NOT_FOUND',
  409: 'CONFLICT', 422: 'INVALID_INPUT', 429: 'RATE_LIMITED', 503: 'DEPENDENCY_UNAVAILABLE',
}
export function applicationFailure(status: number): never {
  throw new ApplicationError(byStatus[status] || 'INTERNAL_ERROR')
}

function isDatabaseFailure(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const name = Object.getOwnPropertyDescriptor(error, 'name')?.value
  return name === 'LibsqlError' || name === 'ClientError' || name === 'ResponseError'
}

export function classifyFailure(error: unknown): ApplicationErrorCode {
  if (error instanceof ApplicationError) return error.code
  if (isDatabaseFailure(error)) return 'DEPENDENCY_UNAVAILABLE'
  if (error && typeof error === 'object') {
    const status = Object.getOwnPropertyDescriptor(error, 'statusCode')?.value
    if (typeof status === 'number') return byStatus[status] || 'INTERNAL_ERROR'
  }
  return 'INTERNAL_ERROR'
}

function safeField(value: string | undefined, limit = 80) {
  return (value || '').replace(/[^a-zA-Z0-9_./-]/g, '_').slice(0, limit)
}

function safeStack(error: unknown): string[] {
  if (!(error instanceof Error) || !error.stack) return []
  return error.stack.split('\n').slice(1, 5).map(line => {
    const frame = /^\s*at\s+([A-Za-z0-9_.$<>]+)(?:\s|$)/.exec(line)
    return frame ? safeField(frame[1], 64) : 'anonymous'
  })
}

export function applicationRoute<T>(route: string, handler: (event: H3Event) => Promise<T> | T) {
  return defineEventHandler(async (event) => {
    const requestId = `req_${randomBytes(12).toString('hex')}`
    const started = performance.now()
    setHeader(event, 'X-Request-Id', requestId)
    try {
      return await handler(event)
    } catch (error) {
      const code = classifyFailure(error)
      const entry = catalogue[code]
      setResponseStatus(event, entry.status)
      setHeader(event, 'Cache-Control', 'private, no-store')
      try {
        const log = {
          timestamp: new Date().toISOString(), severity: entry.status >= 500 ? 'error' : 'warn',
          requestId, code, route: route.replace(/[^a-zA-Z0-9_./[\]-]/g, '_').slice(0, 120), status: entry.status,
          durationMs: Math.max(0, Math.round(performance.now() - started)),
          release: safeField(process.env.COMMIT_REF || process.env.DEPLOY_ID || 'local', 64),
          environment: safeField(process.env.CONTEXT || process.env.NODE_ENV || 'unknown', 32),
          exceptionType: safeField(error instanceof Error ? error.name : typeof error, 40),
          stackFrames: safeStack(error),
        }
        ;(entry.status >= 500 ? console.error : console.warn)(JSON.stringify(log))
      } catch { /* Logging must not alter the customer response. */ }
      return { error: { code, message: entry.message, requestId, retryable: entry.retryable } } as T
    }
  })
}
