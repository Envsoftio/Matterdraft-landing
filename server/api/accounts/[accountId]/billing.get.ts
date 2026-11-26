import { client } from '../../../../lib/db'
import { applicationFailure, applicationRoute } from '../../../utils/application-error'
import { requireAccount } from '../../../utils/customer-account'
import { canManageBilling } from '../../../utils/licence-access'
import { listLicencePlans, publicPlan } from '../../../utils/licence-plans'
import { getLicenceTrial, licenceTrialsEnabled } from '../../../utils/licence-trials'
import { accountPurchases, maxDeviceQuantity } from '../../../utils/licence-purchases'
import { checkoutEnabled } from '../../../utils/razorpay-payment-links'
import { listPrepaidDiscounts, publicDiscount } from '../../../utils/prepaid-discounts'

export default applicationRoute('/api/accounts/[accountId]/billing', async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  const { account } = await requireAccount(event, getRouterParam(event, 'accountId') || '')
  if (!canManageBilling(account.role)) applicationFailure(403)
  const [plans, trial, purchases, discounts] = await Promise.all([
    listLicencePlans(client, account.accountType),
    getLicenceTrial(client, account.id),
    accountPurchases(client, account.id),
    listPrepaidDiscounts(client),
  ])
  const trialsEnabled = licenceTrialsEnabled()
  const canChooseTerm =
    !purchases.lastPayment?.paidThrough || purchases.lastPayment.paidThrough <= Date.now()
  return {
    ...purchases,
    canChooseTerm,
    canPurchase: checkoutEnabled() && canChooseTerm,
    checkoutEnabled: checkoutEnabled(),
    maxDeviceQuantity,
    plans: plans.map(publicPlan),
    discounts: discounts.map(publicDiscount),
    trial:
      trial.status !== 'available' || (trialsEnabled && account.role === 'owner') ? trial : null,
  }
})
