import { client } from '../../../lib/db'
import { applicationRoute } from '../../utils/application-error'
import { requireStaff } from '../../utils/customer-account'
import { listLicencePlans, staffPlan } from '../../utils/licence-plans'
import { listPrepaidDiscounts, staffDiscount } from '../../utils/prepaid-discounts'
import { listCouponOffers } from '../../utils/coupon-offers'

export default applicationRoute('/api/internal/plans', async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  await requireStaff(event, 'super_admin')
  const [plans, discounts, offers] = await Promise.all([
    listLicencePlans(client),
    listPrepaidDiscounts(client),
    listCouponOffers(client),
  ])
  return {
    plans: plans.map(staffPlan),
    discounts: discounts.map(staffDiscount),
    offers,
  }
})
