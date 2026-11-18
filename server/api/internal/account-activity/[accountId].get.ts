import { client } from '../../../../lib/db'
import { applicationFailure, applicationRoute } from '../../../utils/application-error'
import { auditActivityRead, getAccountActivity } from '../../../utils/customer-activity'
import { requireStaff } from '../../../utils/customer-account'

export default applicationRoute('/api/internal/account-activity/[accountId]', async (event) => {
  const actor = await requireStaff(event, 'super_admin')
  const accountId = getRouterParam(event, 'accountId') || ''
  if (!/^[0-9a-f-]{36}$/.test(accountId)) applicationFailure(404)
  const { page: rawPage = '1' } = getQuery(event)
  if (typeof rawPage !== 'string') applicationFailure(422)
  const page = Number(rawPage)
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(page * 25))
    applicationFailure(422)
  setHeader(event, 'Cache-Control', 'private, no-store')
  const result = await getAccountActivity(client, accountId, page)
  if (!result) applicationFailure(404)
  await auditActivityRead(client, actor.id, accountId)
  return result
})
