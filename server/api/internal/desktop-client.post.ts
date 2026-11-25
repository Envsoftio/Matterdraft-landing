import { applicationRoute, applicationFailure } from '../../utils/application-error'
import {
  builtInDesktopClientId,
  desktopRedirectUri,
  isRegisteredDesktopClient,
} from '../../../lib/registered-desktop-client'
import { requireStaff } from '../../utils/customer-account'

export default applicationRoute('/api/internal/desktop-client', async (event) => {
  await requireStaff(event, 'super_admin')
  const origin = getHeader(event, 'origin')
  const expected = new URL(process.env.BETTER_AUTH_URL || 'http://localhost:3000').origin
  if (origin !== expected) applicationFailure(403)
  // Compatibility for older admin callers. Registration is now deployment data;
  // never recreate or re-enable a disabled client from this endpoint.
  if (!(await isRegisteredDesktopClient(builtInDesktopClientId))) applicationFailure(503)
  return { clientId: builtInDesktopClientId, redirectUri: desktopRedirectUri(), created: false }
})
