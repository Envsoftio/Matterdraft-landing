import { applicationRoute, applicationFailure } from '../../utils/application-error'
import { readSignedOAuthRequest } from '../../utils/signed-oauth-request'
import { auth } from '../../../lib/auth'
import { requireCustomer } from '../../utils/customer-account'

export default applicationRoute('/api/portal/oauth-request', async (event) => {
  await requireCustomer(event)
  const { params: verified } = await readSignedOAuthRequest(new URL(getRequestURL(event)))
  const clientId = verified.get('client_id')
  if (!clientId) applicationFailure(400)
  const client = await auth.api.getOAuthClientPublic({
    query: { client_id: clientId },
    headers: event.headers,
  })
  const redirect = verified.get('redirect_uri')
  return {
    clientName: client.client_name || 'Desktop application',
    redirectHost: redirect
      ? new URL(redirect).host || new URL(redirect).protocol.replace(':', '')
      : '',
    scope: verified.get('scope') || '',
  }
})
