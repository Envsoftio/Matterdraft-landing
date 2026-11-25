import { applicationRoute } from '../../../utils/application-error'
import { requireAccount } from '../../../utils/customer-account'
import { listDesktopInstallers } from '../../../utils/desktop-installers'

export default applicationRoute('/api/accounts/[accountId]/download', async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  await requireAccount(event, getRouterParam(event, 'accountId') || '')
  return { installers: listDesktopInstallers() }
})
