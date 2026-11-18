type ApiProblem = {
  error?: { code?: unknown; message?: unknown; requestId?: unknown; retryable?: unknown }
}
type FetchProblem = {
  statusCode?: number
  status?: number
  data?: ApiProblem
  response?: { status?: number; headers?: Headers }
}

const messages: Record<string, string> = {
  BAD_REQUEST: 'Check the request and try again.',
  SIGN_IN_REQUIRED: 'Sign in to continue.',
  ACCESS_DENIED: 'You do not have access to this action.',
  NOT_FOUND: 'This item is unavailable.',
  CONFLICT: 'This has changed. Refresh and review the current state.',
  INVALID_INPUT: 'Check the information entered and try again.',
  RATE_LIMITED: 'Too many requests. Wait before trying again.',
  INTERNAL_ERROR: 'We could not complete this request. Try again later.',
  DEPENDENCY_UNAVAILABLE: 'This service is temporarily unavailable. Try again shortly.',
}

export function parseApiError(cause: unknown) {
  const value = cause && typeof cause === 'object' ? (cause as FetchProblem) : {}
  const problem = value.data?.error
  const code =
    typeof problem?.code === 'string' && Object.hasOwn(messages, problem.code) ? problem.code : ''
  const status = value.response?.status || value.statusCode || value.status || 0
  const requestId =
    typeof problem?.requestId === 'string' && /^req_[0-9a-f]{24}$/.test(problem.requestId)
      ? problem.requestId
      : ''
  const retryAfter = value.response?.headers?.get?.('retry-after') || ''
  const wait = status === 429 && /^\d{1,5}$/.test(retryAfter) ? ` Wait ${retryAfter} seconds.` : ''
  const message = code
    ? messages[code]
    : status === 401
      ? messages.SIGN_IN_REQUIRED
      : status === 429
        ? messages.RATE_LIMITED
        : status
          ? 'The request could not be completed. Refresh and try again.'
          : 'The connection was interrupted or timed out. Check your connection and the current state.'
  return {
    status,
    code,
    requestId,
    ambiguous: !status || status >= 500,
    text: `${message}${wait}${requestId ? ` Reference: ${requestId}.` : ''}`,
  }
}
