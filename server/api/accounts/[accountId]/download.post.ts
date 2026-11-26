import { randomUUID } from 'node:crypto'
import { client } from '../../../../lib/db'
import { isDesktopDownloadPlatform } from '../../../../lib/desktop-download-platforms'
import { applicationFailure, applicationRoute } from '../../../utils/application-error'
import { requireAccount } from '../../../utils/customer-account'
import { getDesktopInstallers, makeInstallerDownloadUrl } from '../../../utils/desktop-installers'
import { readSameOriginJson } from '../../../utils/json-request'

export default applicationRoute('/api/accounts/[accountId]/download', async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  const { user } = await requireAccount(event, getRouterParam(event, 'accountId') || '')
  const { platform, version, releaseTag } = await readSameOriginJson(event)
  if (!isDesktopDownloadPlatform(platform) || typeof version !== 'string') applicationFailure(422)

  const installer = (await getDesktopInstallers()).find((entry) => entry.platform === platform)
  if (!installer) applicationFailure(404)
  if (
    version !== installer.version ||
    (installer.releaseTag && releaseTag !== installer.releaseTag)
  )
    applicationFailure(409)

  const url = await makeInstallerDownloadUrl(installer)
  await client.execute({
    sql: `INSERT INTO desktop_download (id, user_id, platform, version, requested_at)
      VALUES (?, ?, ?, ?, ?)`,
    args: [randomUUID(), user.id, installer.platform, installer.releaseTag, Date.now()],
  })
  return { url }
})
