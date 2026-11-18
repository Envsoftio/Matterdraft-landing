import { applicationRoute, applicationFailure } from '../../utils/application-error'
import { auth } from '../../../lib/auth'
import { client } from '../../../lib/db'
import { requireStaff } from '../../utils/customer-account'

export default applicationRoute('/api/internal/desktop-client', async event => {
  const actor = await requireStaff(event, 'super_admin')
  const origin = getHeader(event, 'origin')
  const expected = new URL(process.env.BETTER_AUTH_URL || 'http://localhost:3000').origin
  if (origin !== expected) applicationFailure(403)
  const redirectUri = process.env.DESKTOP_REDIRECT_URI || 'legal.matterdraft.studio:/oauth/callback'
  if (!/^([a-z][a-z0-9-]*\.)+[a-z][a-z0-9-]*:\/oauth\/callback$/i.test(redirectUri)) {
    applicationFailure(500)
  }
  const existing = await client.execute({ sql: 'SELECT client_id FROM oauth_client WHERE name = ? AND disabled = 0 AND redirect_uris LIKE ? ORDER BY created_at DESC LIMIT 1', args: ['MatterDraft Studio Desktop', `%${redirectUri}%`] })
  if (existing.rows[0]) return { clientId: String(existing.rows[0].client_id), redirectUri, created: false }
  const registration = await auth.api.adminCreateOAuthClient({
    headers: event.headers,
    body: {
      client_name: 'MatterDraft Studio Desktop',
      redirect_uris: [redirectUri],
      token_endpoint_auth_method: 'none',
      application_type: 'native',
      scope: 'openid profile email offline_access',
      grant_types: ['authorization_code', 'refresh_token'],
    },
  })
  const id = registration.client_id
  if (!id) applicationFailure(500)
  await client.execute({ sql: 'INSERT INTO audit_event (id, actor_user_id, event_type, subject_type, subject_id, event_detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)', args: [crypto.randomUUID(), actor.id, 'oauth_client.register', 'oauth_client', id, 'Registered MatterDraft desktop app', Date.now()] })
  return { clientId: id, redirectUri, created: true }
})
