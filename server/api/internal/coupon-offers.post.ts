import { client } from '../../../lib/db'
import { applicationRoute } from '../../utils/application-error'
import { requireStaff } from '../../utils/customer-account'
import { readSameOriginJson } from '../../utils/json-request'
import { saveCouponOffer } from '../../utils/coupon-offers'

export default applicationRoute('/api/internal/coupon-offers', async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  const actor = await requireStaff(event, 'super_admin')
  return { offer: await saveCouponOffer(client, actor.id, await readSameOriginJson(event)) }
})
