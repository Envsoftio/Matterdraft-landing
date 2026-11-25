import { client } from '../../../lib/db'
import { applicationFailure, applicationRoute } from '../../utils/application-error'
import { readJsonBytes } from '../../utils/json-request'
import { reconcilePaymentWebhook } from '../../utils/licence-purchases'
import { verifyPaymentWebhook } from '../../utils/razorpay-payment-links'

export default applicationRoute('/api/webhooks/razorpay', async (event) => {
  const bytes = await readJsonBytes(event, 64 * 1024)
  if (!verifyPaymentWebhook(bytes, getHeader(event, 'x-razorpay-signature')))
    applicationFailure(403)
  let payload
  try {
    payload = JSON.parse(bytes.toString('utf8'))
  } catch {
    applicationFailure(400)
  }
  if (payload?.event === 'payment_link.paid') {
    const link = payload.payload?.payment_link?.entity
    if (typeof link?.reference_id !== 'string' || typeof link.id !== 'string')
      applicationFailure(422)
    await reconcilePaymentWebhook(client, link.reference_id, link.id)
  }
  return { received: true }
})
