import { client } from '../../../lib/db'
import { applicationRoute } from '../../utils/application-error'
import { requireStaff } from '../../utils/customer-account'
import { readSameOriginJson } from '../../utils/json-request'
import { savePrepaidDiscount } from '../../utils/prepaid-discounts'

export default applicationRoute('/api/internal/prepaid-discounts', async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  const actor = await requireStaff(event, 'super_admin')
  const input = await readSameOriginJson(event)
  return { discount: await savePrepaidDiscount(client, actor.id, input) }
})
