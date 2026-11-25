import { client } from '../../../../lib/db'
import { applicationFailure, applicationRoute } from '../../../utils/application-error'
import { requireAccount } from '../../../utils/customer-account'
import { readSameOriginJson } from '../../../utils/json-request'
import { canManageBilling } from '../../../utils/licence-access'
import { checkoutPurchase, quoteCouponPurchase } from '../../../utils/licence-purchases'

export default applicationRoute('/api/accounts/[accountId]/checkout', async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  const { account, user } = await requireAccount(event, getRouterParam(event, 'accountId') || '')
  if (!canManageBilling(account.role)) applicationFailure(403)
  const input = await readSameOriginJson(event)
  if (input.action === 'quote-coupon') {
    return {
      quote: await quoteCouponPurchase(client, account.id, user.id, input),
      checkoutUrl: null,
    }
  }
  return { ...(await checkoutPurchase(client, account.id, user.id, input)), quote: null }
})
