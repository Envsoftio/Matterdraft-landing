import { applicationRoute } from '../../utils/application-error'
import {
  builtInDesktopClientId,
  desktopRedirectUri,
  isRegisteredDesktopClient,
} from '../../../lib/registered-desktop-client'
import { requireStaff } from '../../utils/customer-account'

export default applicationRoute('/api/internal/desktop-client', async (event) => {
  await requireStaff(event, 'super_admin')
  return {
    clientId: (await isRegisteredDesktopClient(builtInDesktopClientId))
      ? builtInDesktopClientId
      : null,
    redirectUri: desktopRedirectUri(),
    pkceMethod: 'S256',
    clientType: 'public',
  }
})
