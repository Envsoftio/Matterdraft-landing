import { client } from '../../../lib/db'
import { applicationRoute } from '../../utils/application-error'
import { requireStaff } from '../../utils/customer-account'
import { readSameOriginJson } from '../../utils/json-request'
import { saveLicencePlan } from '../../utils/licence-plans'

export default applicationRoute('/api/internal/plans', async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  const actor = await requireStaff(event, 'super_admin')
  const input = await readSameOriginJson(event)
  return {
    plan: await saveLicencePlan(client, actor.id, input),
  }
})
