import { client } from '../../../lib/db'
import { applicationFailure, applicationRoute } from '../../utils/application-error'
import { auditActivityRead, listAccountActivity } from '../../utils/customer-activity'
import { requireStaff } from '../../utils/customer-account'

export default applicationRoute('/api/internal/account-activity', async (event) => {
  const actor = await requireStaff(event, 'super_admin')
  const { search = '', type = '', page: rawPage = '1' } = getQuery(event)
  if (
    typeof search !== 'string' ||
    search.length > 100 ||
    (type !== '' && type !== 'personal' && type !== 'organisation') ||
    typeof rawPage !== 'string'
  )
    applicationFailure(422)
  const page = Number(rawPage)
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(page * 25))
    applicationFailure(422)
  setHeader(event, 'Cache-Control', 'private, no-store')
  const result = await listAccountActivity(client, search.trim().toLowerCase(), type, page)
  await auditActivityRead(client, actor.id)
  return result
})
