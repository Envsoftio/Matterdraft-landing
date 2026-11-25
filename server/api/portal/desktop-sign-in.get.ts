import {
  desktopRedirectUri,
  isRegisteredDesktopClient,
} from '../../../lib/registered-desktop-client'
import { applicationRoute } from '../../utils/application-error'
import { readSignedOAuthRequest } from '../../utils/signed-oauth-request'

export default applicationRoute('/api/portal/desktop-sign-in', async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  const { signed, params } = await readSignedOAuthRequest(new URL(getRequestURL(event)))
  const clientId = params.get('client_id')
  const state = params.get('state')
  const redirectUri = desktopRedirectUri()
  const scopes = params.get('scope')?.split(/\s+/).sort().join(' ')
  if (
    !clientId ||
    !state ||
    params.get('redirect_uri') !== redirectUri ||
    params.get('response_type') !== 'code' ||
    params.get('code_challenge_method') !== 'S256' ||
    !params.get('code_challenge') ||
    scopes !== 'email offline_access openid profile' ||
    ['resource', 'claims', 'authorization_details'].some((key) => params.has(key))
  )
    return { desktop: null }

  const freshLogin = params.get('prompt')?.split(/\s+/).includes('login') === true
  return {
    desktop: (await isRegisteredDesktopClient(clientId))
      ? { clientId, state, redirectUri, signed, freshLogin }
      : null,
  }
})
