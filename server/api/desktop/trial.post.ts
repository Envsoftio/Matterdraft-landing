import { client } from '../../../lib/db'
import { auth } from '../../../lib/auth'
import { applicationFailure, applicationRoute } from '../../utils/application-error'
import { activateDesktopTrial, createTrialChallenge } from '../../utils/desktop-trial-activation'
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
  const { accountId, action, publicKey, nonce, proof } = body as Record<string, unknown>
  if (typeof accountId !== 'string' || !accountId || accountId.length > 128) applicationFailure(422)
  if (action === 'challenge' && typeof publicKey === 'string')
    return createTrialChallenge(client, accountId, profile.sub, publicKey)
  if (action === 'activate' && typeof nonce === 'string' && typeof proof === 'string')
    return activateDesktopTrial(client, accountId, profile.sub, nonce, proof)
  applicationFailure(422)
})
