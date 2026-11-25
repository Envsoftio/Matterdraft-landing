import { createHmac, timingSafeEqual } from 'node:crypto'
import { accessMonthsLabel } from '../../shared/utils/prepaid-pricing.ts'
import { applicationFailure } from './application-error.ts'

export interface PaymentLink {
  id: string
  reference_id: string
  amount: number
  amount_paid: number
  currency: string
  status: string
  short_url: string
  payments: { payment_id: string; status: string; amount: number; created_at: number }[] | null
}

export function checkoutEnabled() {
  return Boolean(
    process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_') &&
    process.env.RAZORPAY_KEY_SECRET &&
    process.env.RAZORPAY_WEBHOOK_SECRET,
  )
}

async function request<T>(path: string, body?: object): Promise<T> {
  if (!checkoutEnabled()) applicationFailure(503)
  try {
    const authorization = Buffer.from(
      `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`,
    ).toString('base64')
    const response = await fetch(`https://api.razorpay.com/v1/payment_links${path}`, {
      method: body ? 'POST' : 'GET',
      headers: { Authorization: `Basic ${authorization}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(8000),
    })
    if (response.ok) return (await response.json()) as T
  } catch {
    // Preserve the stored attempt so the next request can recover the same link.
  }
  applicationFailure(503)
}

export function getPaymentLink(id: string) {
  return request<PaymentLink>(`/${encodeURIComponent(id)}`)
}

export async function findPaymentLink(reference: string) {
  const results = await request<{ payment_links: PaymentLink[] }>(
    `?reference_id=${encodeURIComponent(reference)}`,
  )
  if (!Array.isArray(results.payment_links)) applicationFailure(503)
  return results.payment_links.find((link) => link.reference_id === reference)
}

export function createPaymentLink(
  reference: string,
  amount: number,
  expiresAt: number,
  accountId: string,
  accessMonths: number,
) {
  const origin = new URL(process.env.BETTER_AUTH_URL || 'http://localhost:3000').origin
  return request<PaymentLink>('/', {
    amount,
    currency: 'INR',
    accept_partial: false,
    reference_id: reference,
    expire_by: Math.floor(expiresAt / 1000),
    description: `MatterDraft Studio · ${accessMonthsLabel(accessMonths)} prepaid access · Includes GST`,
    callback_url: `${origin}/a/${encodeURIComponent(accountId)}/billing?checkout=return`,
    callback_method: 'get',
    notify: { email: false, sms: false },
    reminder_enable: false,
  })
}

export function verifyPaymentWebhook(bytes: Buffer, signature: string | undefined) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret || !signature || !/^[a-f0-9]{64}$/i.test(signature)) return false
  const expected = createHmac('sha256', secret).update(bytes).digest()
  return timingSafeEqual(expected, Buffer.from(signature, 'hex'))
}
