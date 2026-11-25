import { randomUUID } from 'node:crypto'
import type { Client, Row } from '@libsql/client'
import { maximumAccessMonths, prepaidPrice } from '../../shared/utils/prepaid-pricing.ts'
import { applicationFailure } from './application-error.ts'
import { eligibleCouponOffer, normalizeCouponCode } from './coupon-offers.ts'
import { prepaidDiscountForTerm } from './prepaid-discounts.ts'
import {
  checkoutEnabled,
  createPaymentLink,
  findPaymentLink,
  getPaymentLink,
  type PaymentLink,
} from './razorpay-payment-links.ts'

export const maxDeviceQuantity = 100
const linkLifetime = 30 * 60 * 1000

function purchaseTotal(row: Row) {
  return row.total_amount == null
    ? Number(row.quantity) * Number(row.unit_price)
    : Number(row.total_amount)
}

export function purchaseView(row: Row | undefined) {
  if (!row) return null
  return {
    id: String(row.id),
    planName: String(row.plan_name),
    quantity: Number(row.quantity),
    total: purchaseTotal(row),
    accessMonths: Number(row.access_months),
    discountPercent: Number(row.discount_percent),
    couponCode: row.coupon_code as string | null,
    couponDiscount: Number(row.coupon_discount),
    status: row.status as 'pending' | 'paid' | 'expired',
    paidThrough: row.paid_through == null ? null : Number(row.paid_through),
  }
}

async function pendingPurchase(db: Client, accountId: string) {
  const { rows } = await db.execute({
    sql: "SELECT * FROM licence_purchase WHERE account_id = ? AND status = 'pending'",
    args: [accountId],
  })
  return rows[0]
}

export async function accountPurchases(db: Client, accountId: string) {
  const [paid, pending] = await db.batch(
    [
      {
        sql: `SELECT * FROM licence_purchase WHERE account_id = ? AND status = 'paid'
        ORDER BY paid_through DESC LIMIT 1`,
        args: [accountId],
      },
      {
        sql: "SELECT * FROM licence_purchase WHERE account_id = ? AND status = 'pending'",
        args: [accountId],
      },
    ],
    'read',
  )
  return {
    lastPayment: purchaseView(paid?.rows[0]),
    pendingPurchase: purchaseView(pending?.rows[0]),
  }
}

async function pricePurchase(
  db: Pick<Client, 'execute'>,
  accountId: string,
  buyerId: string,
  input: Record<string, unknown>,
  now: number,
) {
  const { planId, revision, quantity, accessMonths = 1 } = input
  if (
    typeof planId !== 'string' ||
    typeof revision !== 'number' ||
    !Number.isSafeInteger(revision) ||
    typeof quantity !== 'number' ||
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > maxDeviceQuantity ||
    typeof accessMonths !== 'number' ||
    !Number.isInteger(accessMonths) ||
    accessMonths < 1 ||
    accessMonths > maximumAccessMonths
  )
    applicationFailure(422)

  const { rows } = await db.execute({
    sql: `SELECT p.name, p.monthly_device_price, a.account_type, ${prepaidDiscountForTerm} AS discount_percent
      FROM customer_account a
      JOIN licence_plan p ON p.account_type = a.account_type
      JOIN account_membership m ON m.account_id = a.id
      WHERE a.id = ? AND m.user_id = ? AND m.role IN ('owner', 'billing_manager')
        AND p.id = ? AND p.revision = ? AND p.status = 'published' AND p.monthly_device_price >= 100
        AND ? >= p.minimum_devices AND (a.account_type = 'organisation' OR ? = p.minimum_devices)
        AND NOT EXISTS (SELECT 1 FROM licence_purchase
          WHERE account_id = a.id AND (status = 'pending' OR (status = 'paid' AND paid_through > ?)))`,
    args: [accessMonths, accountId, buyerId, planId, revision, quantity, quantity, now],
  })
  const plan = rows[0]
  if (!plan) applicationFailure(409)
  const unitPrice = Number(plan.monthly_device_price)
  const monthlyAmount = unitPrice * (plan.account_type === 'personal' ? 1 : quantity)
  const automatic = prepaidPrice(monthlyAmount, accessMonths, Number(plan.discount_percent))

  const code = input.couponCode == null ? null : normalizeCouponCode(input.couponCode)
  if (input.couponCode != null && !code) applicationFailure(422)
  const offer = code
    ? await eligibleCouponOffer(
        db,
        code,
        accountId,
        String(plan.account_type),
        planId,
        accessMonths,
        now,
      )
    : null
  if (code && !offer) applicationFailure(422)

  const couponDiscount = Math.min(offer?.discountAmount ?? 0, automatic.subtotal - 100)
  const couponWins = offer !== null && couponDiscount > automatic.savings
  const quote = {
    ...automatic,
    total: couponWins ? automatic.subtotal - couponDiscount : automatic.total,
    couponCode: couponWins ? offer.code : null,
    couponDiscount: couponWins ? couponDiscount : 0,
  }
  return {
    planId,
    revision,
    quantity,
    accessMonths,
    planName: String(plan.name),
    unitPrice,
    quote,
    appliedOffer: couponWins ? offer : null,
  }
}

export async function quoteCouponPurchase(
  db: Client,
  accountId: string,
  buyerId: string,
  input: Record<string, unknown>,
) {
  const code = normalizeCouponCode(input.couponCode)
  if (!code) applicationFailure(422)
  await reconcileExpiredCouponPurchases(db, code)
  return (await pricePurchase(db, accountId, buyerId, input, Date.now())).quote
}

export async function reservePurchase(
  db: Client,
  accountId: string,
  buyerId: string,
  input: Record<string, unknown>,
) {
  // Resolve and consume the offer in one write transaction with the purchase.
  const tx = await db.transaction('write')
  try {
    const now = Date.now()
    const { planId, revision, quantity, accessMonths, planName, unitPrice, quote, appliedOffer } =
      await pricePurchase(tx, accountId, buyerId, input, now)
    if (
      (input.couponCode != null && (!appliedOffer || input.quotedTotal !== quote.total)) ||
      (input.quotedTotal !== undefined && input.quotedTotal !== quote.total)
    )
      applicationFailure(409)

    const { rows } = await tx.execute({
      sql: `INSERT INTO licence_purchase
        (id, account_id, buyer_id, plan_id, plan_revision, plan_name, unit_price, quantity, total_amount,
          access_months, discount_percent, coupon_offer_id, coupon_offer_revision, coupon_code, coupon_discount,
          status, created_at, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?) RETURNING *`,
      args: [
        randomUUID(),
        accountId,
        buyerId,
        planId,
        revision,
        planName,
        unitPrice,
        quantity,
        quote.total,
        accessMonths,
        appliedOffer ? 0 : quote.discountPercent,
        appliedOffer?.id ?? null,
        appliedOffer?.revision ?? null,
        quote.couponCode,
        quote.couponDiscount,
        now,
        now + linkLifetime,
      ],
    })
    await tx.commit()
    return rows[0]!
  } finally {
    tx.close()
  }
}

function endOfAccess(instant: number, months: number) {
  const date = new Date(instant)
  const day = date.getUTCDate()
  date.setUTCDate(1)
  date.setUTCMonth(date.getUTCMonth() + months)
  const limit = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate()
  date.setUTCDate(Math.min(day, limit))
  return date.getTime()
}

async function reconcileLink(db: Client, row: Row, link: PaymentLink) {
  const id = String(row.id)
  const total = purchaseTotal(row)
  if (
    link.reference_id !== id ||
    !/^plink_[a-zA-Z0-9]+$/.test(link.id) ||
    (row.link_id && row.link_id !== link.id) ||
    link.currency !== 'INR' ||
    link.amount !== total
  )
    applicationFailure(503)

  await db.execute({
    sql: "UPDATE licence_purchase SET link_id = ? WHERE id = ? AND status = 'pending' AND link_id IS NULL",
    args: [link.id, id],
  })
  if (link.status === 'paid') {
    const payment = link.payments?.find(
      (entry) =>
        entry.status === 'captured' &&
        entry.amount === total &&
        /^pay_[a-zA-Z0-9]+$/.test(entry.payment_id),
    )
    if (link.amount_paid !== total || !payment || !Number.isSafeInteger(payment.created_at))
      applicationFailure(503)
    const paidFrom = Math.max(payment.created_at * 1000, Number(row.created_at))
    if (paidFrom > Date.now() + 60_000) applicationFailure(503)
    await db.batch(
      [
        {
          sql: `UPDATE licence_purchase SET status = 'paid', payment_id = ?, paid_from = ?, paid_through = ?
          WHERE id = ? AND status = 'pending' AND link_id = ?`,
          args: [
            payment.payment_id,
            paidFrom,
            endOfAccess(paidFrom, Number(row.access_months)),
            id,
            link.id,
          ],
        },
        {
          sql: `INSERT INTO audit_event (id, account_id, actor_user_id, event_type, subject_type, subject_id, event_detail, created_at)
          SELECT ?, ?, ?, 'licence_purchase.paid', 'licence_purchase', ?, ?, ? WHERE changes() = 1`,
          args: [
            randomUUID(),
            row.account_id!,
            row.buyer_id!,
            id,
            JSON.stringify({
              total,
              currency: 'INR',
              quantity: row.quantity,
              accessMonths: row.access_months,
              discountPercent: row.discount_percent,
              couponCode: row.coupon_code,
              couponDiscount: row.coupon_discount,
            }),
            Date.now(),
          ],
        },
      ],
      'write',
    )
    return null
  }
  if (link.status === 'expired' || link.status === 'cancelled') {
    if (link.amount_paid !== 0) applicationFailure(503)
    await expirePurchase(db, id)
    return null
  }
  if (link.status !== 'created' || link.amount_paid !== 0) applicationFailure(503)
  if (!/^https:\/\/(rzp\.io|razorpay\.com)\//.test(link.short_url)) applicationFailure(503)
  return link.short_url
}

async function expirePurchase(db: Client, id: string) {
  await db.execute({
    sql: "UPDATE licence_purchase SET status = 'expired' WHERE id = ? AND status = 'pending'",
    args: [id],
  })
}

async function checkPurchase(db: Client, row: Row, allowCreate: boolean) {
  const id = String(row.id)
  const expiresAt = Number(row.expires_at)
  const link = row.link_id ? await getPaymentLink(String(row.link_id)) : await findPaymentLink(id)
  if (link) {
    // The list endpoint can omit captured payment details.
    const detail = link.status === 'paid' && !row.link_id ? await getPaymentLink(link.id) : link
    return reconcileLink(db, row, detail)
  }

  if (expiresAt <= Date.now()) {
    // Give the provider lookup time to become consistent after an interrupted create.
    if (expiresAt + 60_000 <= Date.now()) await expirePurchase(db, id)
    return null
  }
  if (!allowCreate || expiresAt <= Date.now() + 15_000) return null
  const created = await createPaymentLink(
    id,
    purchaseTotal(row),
    expiresAt,
    String(row.account_id),
    Number(row.access_months),
  ).catch(async () => {
    const existing = await findPaymentLink(id)
    if (!existing) applicationFailure(503)
    return getPaymentLink(existing.id)
  })
  return reconcileLink(db, row, created)
}

async function reconcileExpiredCouponPurchases(db: Client, code: string) {
  if (!checkoutEnabled()) return
  const { rows } = await db.execute({
    sql: `SELECT p.* FROM licence_purchase p JOIN coupon_offer o ON o.id = p.coupon_offer_id
      WHERE o.code = ? AND o.status = 'published' AND o.redemption_limit IS NOT NULL
        AND p.status = 'pending' AND p.expires_at <= ?
        AND o.redemption_limit <= (
          SELECT count(*) FROM licence_purchase WHERE coupon_offer_id = o.id AND status IN ('pending', 'paid')
        )
      ORDER BY p.expires_at LIMIT 3`,
    args: [code, Date.now() - 60_000],
  })
  // A reservation stays in place when the provider cannot confirm its outcome.
  await Promise.allSettled(rows.map((row) => checkPurchase(db, row, false)))
}

export async function checkoutPurchase(
  db: Client,
  accountId: string,
  buyerId: string,
  input: Record<string, unknown>,
) {
  if (!checkoutEnabled()) applicationFailure(503)
  const pending = await pendingPurchase(db, accountId)
  if (input.action === 'check' || input.action === 'resume') {
    const checkoutUrl = pending ? await checkPurchase(db, pending, input.action === 'resume') : null
    return { checkoutUrl }
  }
  if (input.action !== 'purchase') applicationFailure(422)
  if (pending) applicationFailure(409)
  const code = normalizeCouponCode(input.couponCode)
  if (code) await reconcileExpiredCouponPurchases(db, code)
  const row = await reservePurchase(db, accountId, buyerId, input)
  return { checkoutUrl: await checkPurchase(db, row, true) }
}

export async function reconcilePaymentWebhook(db: Client, reference: string, linkId: string) {
  if (!/^plink_[a-zA-Z0-9]+$/.test(linkId)) applicationFailure(422)
  const { rows } = await db.execute({
    sql: "SELECT * FROM licence_purchase WHERE id = ? AND status = 'pending'",
    args: [reference],
  })
  if (rows[0]) {
    const link = await getPaymentLink(linkId)
    if (link.status !== 'paid') applicationFailure(503)
    await reconcileLink(db, rows[0], link)
  }
}
