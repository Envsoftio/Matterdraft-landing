import { applicationFailure, applicationRoute } from '../../utils/application-error'
import { client } from '../../../lib/db'
import { requireStaff } from '../../utils/customer-account'
import {
  auditActivityRead,
  businessOperations,
  customerIssues,
} from '../../utils/customer-activity'
import { recentServiceFailures } from '../../utils/service-failure'

export default applicationRoute('/api/internal/overview', async (event) => {
  const actor = await requireStaff(event, 'super_admin')
  const days = getQuery(event).days ?? '7'
  if (days !== '7' && days !== '30') applicationFailure(422)
  setHeader(event, 'Cache-Control', 'private, no-store')
  const now = Date.now()
  const [counts, issues, failures] = await Promise.all([
    businessOperations(client, now - Number(days) * 86_400_000),
    customerIssues(client),
    recentServiceFailures(client, now),
  ])
  await auditActivityRead(client, actor.id)
  return { counts, issues, failures, checkedAt: now }
})
