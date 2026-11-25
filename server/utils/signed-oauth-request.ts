import { verifyOAuthQueryParams } from '@better-auth/oauth-provider'
import { auth } from '../../lib/auth'
import { applicationFailure } from './application-error'

export async function readSignedOAuthRequest(url: URL) {
  const params = url.searchParams
  const fields = new Set(['sig', 'ba_param', ...params.getAll('ba_param')])
  const signed = new URLSearchParams([...params].filter(([key]) => fields.has(key))).toString()
  const { secret } = await auth.$context
  if (!(await verifyOAuthQueryParams(signed, secret))) applicationFailure(400)
  return { signed, params: new URLSearchParams(signed) }
}
