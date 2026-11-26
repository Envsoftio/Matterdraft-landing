import { client } from '../../../lib/db'
import { auth } from '../../../lib/auth'
import { applicationFailure, applicationRoute } from '../../utils/application-error'
import { activateDesktopTrial } from '../../utils/desktop-trial-activation'
import { readJsonBytes } from '../../utils/json-request'

export default applicationRoute('/api/desktop/trial', async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  const authorization = getHeader(event, 'authorization')
  if (!authorization || !/^Bearer [^\s,]+$/i.test(authorization)) applicationFailure(401)
  // UserInfo validates the access token. The workspace claim is issued only
  // for the registered first-party desktop client with the profile scope.
  const profile = await auth.api.oauth2UserInfo({ headers: new Headers({ authorization }) })
  if (
    !('matterdraft_accounts' in profile) ||
    !Array.isArray(profile.matterdraft_accounts) ||
    !('email_verified' in profile) ||
    profile.email_verified !== true ||
    typeof profile.sub !== 'string'
  )
    applicationFailure(403)

  const bytes = await readJsonBytes(event, 4096)
  let body: unknown
  try {
    body = JSON.parse(bytes.toString('utf8'))
  } catch {
    applicationFailure(400)
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) applicationFailure(400)
  const { accountId, action } = body as Record<string, unknown>
  if (typeof accountId !== 'string' || !accountId || accountId.length > 128 || action !== 'activate')
    applicationFailure(422)
  return activateDesktopTrial(client, accountId, profile.sub)
})
