import { applicationRoute, applicationFailure } from '../../utils/application-error'
import { client } from '../../../lib/db'
import { requireStaff } from '../../utils/customer-account'

export default applicationRoute('/api/internal/desktop-client', async (event) => {
  await requireStaff(event, 'super_admin')
  const redirectUri = process.env.DESKTOP_REDIRECT_URI || 'legal.matterdraft.studio:/oauth/callback'
  const existing = await client.execute({
    sql: 'SELECT client_id FROM oauth_client WHERE name = ? AND disabled = 0 AND redirect_uris LIKE ? ORDER BY created_at DESC LIMIT 1',
    args: ['MatterDraft Studio Desktop', `%${redirectUri}%`],
  })
  return {
    clientId: existing.rows[0] ? String(existing.rows[0].client_id) : null,
    redirectUri,
    pkceMethod: 'S256',
    clientType: 'public',
  }
})
