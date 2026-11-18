import { applicationRoute, applicationFailure } from '../../utils/application-error'
import { verifyOAuthQueryParams } from '@better-auth/oauth-provider'
import { auth } from '../../../lib/auth'
import { requireUser } from '../../utils/customer-account'

export default applicationRoute('/api/portal/oauth-request', async event => {
  await requireUser(event)
  const params = new URL(getRequestURL(event)).searchParams
  const signed = new Set(['sig', 'ba_param', ...params.getAll('ba_param')])
  const query = new URLSearchParams([...params].filter(([key]) => signed.has(key))).toString()
  const { secret } = await auth.$context
  if (!await verifyOAuthQueryParams(query, secret)) applicationFailure(400)
  const verified = new URLSearchParams(query)
  const clientId = verified.get('client_id')
  if (!clientId) applicationFailure(400)
  const client = await auth.api.getOAuthClientPublic({ query: { client_id: clientId }, headers: event.headers })
  const redirect = verified.get('redirect_uri')
  return {
    clientName: client.client_name || 'Desktop application',
    redirectHost: redirect ? new URL(redirect).host || new URL(redirect).protocol.replace(':', '') : '',
    scope: verified.get('scope') || '',
  }
})
