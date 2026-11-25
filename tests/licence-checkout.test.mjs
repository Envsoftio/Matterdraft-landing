import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import test from 'node:test'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { listCouponOffers, saveCouponOffer } from '../server/utils/coupon-offers.ts'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { accessDiscountPercent, prepaidPrice } from '../shared/utils/prepaid-pricing.ts'
import { listLicencePlans, saveLicencePlan, staffPlan } from '../server/utils/licence-plans.ts'
import {
  accountPurchases,
  checkoutPurchase,
  reconcilePaymentWebhook,
  quoteCouponPurchase,
  reservePurchase,
} from '../server/utils/licence-purchases.ts'
import { checkoutEnabled, verifyPaymentWebhook } from '../server/utils/razorpay-payment-links.ts'
import {
  listPrepaidDiscounts,
  savePrepaidDiscount,
  staffDiscount,
} from '../server/utils/prepaid-discounts.ts'

function configureRazorpayTest(t) {
  const env = {
    RAZORPAY_KEY_ID: 'rzp_test_fixture',
    RAZORPAY_KEY_SECRET: 'fixture',
    RAZORPAY_WEBHOOK_SECRET: 'fixture-webhook',
  }
  for (const [key, value] of Object.entries(env)) {
    const previous = process.env[key]
    t.after(() =>
      previous === undefined ? delete process.env[key] : (process.env[key] = previous),
    )
    process.env[key] = value
  }
  return env
}

test('prepaid discounts apply to the whole term at each threshold', () => {
  const tiers = [
    { minimumMonths: 4, discountPercent: 5 },
    { minimumMonths: 6, discountPercent: 10 },
    { minimumMonths: 12, discountPercent: 15 },
  ]
  for (const [months, discountPercent, total] of [
    [1, 0, 49900],
    [2, 0, 99800],
    [3, 0, 149700],
    [4, 5, 189620],
    [5, 5, 237025],
    [6, 10, 269460],
    [11, 10, 494010],
    [12, 15, 508980],
  ]) {
    assert.equal(accessDiscountPercent(months, tiers), discountPercent)
    assert.deepEqual(prepaidPrice(49900, months, discountPercent), {
      subtotal: 49900 * months,
      discountPercent,
      total,
      savings: 49900 * months - total,
    })
  }
  assert.equal(prepaidPrice(101, 5, 5).total, 480)
  assert.equal(accessDiscountPercent(12, []), 0)
})

test('catalogue seed, price snapshots, device minimum and idempotent test checkout', async (t) => {
  const db = createClient({ url: 'file::memory:' })
  t.after(() => db.close())
  await migrate(drizzle(db), { migrationsFolder: './drizzle' })
  await db.batch(
    [
      "INSERT INTO user (id, email, name) VALUES ('owner', 'owner@example.test', 'Owner')",
      "INSERT INTO customer_account (id, name, account_type, created_at) VALUES ('chamber', 'Chamber', 'organisation', 1)",
      "INSERT INTO account_membership (account_id, user_id, role, created_at) VALUES ('chamber', 'owner', 'owner', 1)",
      "INSERT INTO customer_account (id, name, account_type, personal_owner_user_id, created_at) VALUES ('personal', 'Owner', 'personal', 'owner', 1)",
      "INSERT INTO account_membership (account_id, user_id, role, created_at) VALUES ('personal', 'owner', 'owner', 1)",
    ],
    'write',
  )

  const plans = (await listLicencePlans(db)).map(staffPlan)
  const chamber = plans.find(({ id }) => id === 'launch-chamber')
  const solo = plans.find(({ id }) => id === 'launch-solo')
  assert.equal(chamber.monthlyPrice, 34900)
  assert.equal(chamber.minimumDevices, 3)
  assert.equal(solo.monthlyPrice, 49900)
  assert.equal(solo.minimumDevices, 2)
  assert.deepEqual(
    (await listLicencePlans(db, 'organisation')).map(({ id }) => id),
    [chamber.id],
  )
  const price = { planId: chamber.id, revision: chamber.revision, quantity: 3 }
  await assert.rejects(reservePurchase(db, 'chamber', 'owner', { ...price, quantity: 2 }), {
    code: 'CONFLICT',
  })
  await assert.rejects(reservePurchase(db, 'chamber', 'stranger', price), { code: 'CONFLICT' })
  await assert.rejects(reservePurchase(db, 'chamber', 'owner', { ...price, planId: solo.id }), {
    code: 'CONFLICT',
  })

  const env = configureRazorpayTest(t)
  assert.equal(checkoutEnabled(), true)
  const bytes = Buffer.from('{"event":"payment_link.paid"}')
  const signature = createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET).update(bytes).digest('hex')
  assert.equal(verifyPaymentWebhook(bytes, signature), true)
  assert.equal(verifyPaymentWebhook(Buffer.from('different'), signature), false)

  let storedLink
  let createCount = 0
  let expectedAmount = 104700
  let expectedTerm = '1 month'
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    if (options.method === 'POST') {
      const request = JSON.parse(options.body)
      assert.equal(request.amount, expectedAmount)
      assert.ok(request.description.includes(`${expectedTerm} prepaid access`))
      assert.ok(request.description.includes('Includes GST'))
      assert.equal(request.currency, 'INR')
      assert.equal(request.accept_partial, false)
      storedLink = {
        id: `plink_test${createCount + 1}`,
        reference_id: request.reference_id,
        amount: request.amount,
        currency: request.currency,
        status: 'created',
        amount_paid: 0,
        short_url: 'https://rzp.io/i/test001',
      }
      createCount++
      // The provider committed the link, then the response was lost.
      throw new Error('connection lost')
    }
    return Response.json(
      url.includes('?reference_id=')
        ? { payment_links: storedLink ? [storedLink] : [] }
        : storedLink,
    )
  })

  const result = await checkoutPurchase(db, 'chamber', 'owner', { action: 'purchase', ...price })
  assert.equal(result.checkoutUrl, storedLink.short_url)
  const reopened = await checkoutPurchase(db, 'chamber', 'owner', { action: 'resume' })
  assert.equal(reopened.checkoutUrl, result.checkoutUrl)
  assert.equal(createCount, 1)
  await assert.rejects(reservePurchase(db, 'chamber', 'owner', price), { code: 'CONFLICT' })

  const edited = await saveLicencePlan(db, 'owner', {
    ...chamber,
    action: 'edit',
    monthlyPrice: 35900,
  })
  assert.equal(edited.revision, chamber.revision + 1)
  assert.equal((await accountPurchases(db, 'chamber')).pendingPurchase.total, 104700)
  await assert.rejects(saveLicencePlan(db, 'owner', { ...edited, action: 'delete' }), {
    code: 'CONFLICT',
  })
  const unused = await saveLicencePlan(db, 'owner', { ...solo, action: 'create', name: 'Unused' })
  await saveLicencePlan(db, 'owner', { ...unused, action: 'delete' })
  assert.ok(!(await listLicencePlans(db)).some(({ id }) => id === unused.id))
  await saveLicencePlan(db, 'owner', { ...edited, action: 'archive' })

  storedLink.status = 'paid'
  storedLink.amount_paid = 104700
  storedLink.payments = [
    {
      status: 'authorised',
      amount: 104700,
      payment_id: 'pay_trial1',
      created_at: Math.floor(Date.now() / 1000),
    },
  ]
  await assert.rejects(reconcilePaymentWebhook(db, storedLink.reference_id, storedLink.id), {
    code: 'DEPENDENCY_UNAVAILABLE',
  })
  assert.equal((await accountPurchases(db, 'chamber')).lastPayment, null)
  storedLink.payments[0].status = 'captured'
  await reconcilePaymentWebhook(db, storedLink.reference_id, storedLink.id)
  await reconcilePaymentWebhook(db, storedLink.reference_id, storedLink.id)
  const purchases = await accountPurchases(db, 'chamber')
  assert.equal(purchases.pendingPurchase, null)
  assert.equal(purchases.lastPayment.total, 104700)
  assert.equal(purchases.lastPayment.quantity, 3)
  assert.equal(purchases.lastPayment.accessMonths, 1)
  assert.ok(purchases.lastPayment.paidThrough > Date.now())
  const audit = await db.execute(
    "SELECT count(*) AS n FROM audit_event WHERE event_type = 'licence_purchase.paid'",
  )
  assert.equal(audit.rows[0].n, 1)

  const soloPrice = { planId: solo.id, revision: solo.revision, quantity: 2, accessMonths: 6 }
  const discounts = (await listPrepaidDiscounts(db)).map(staffDiscount)
  assert.deepEqual(
    discounts.map(({ minimumMonths, discountPercent }) => [minimumMonths, discountPercent]),
    [
      [4, 5],
      [6, 10],
      [12, 15],
    ],
  )
  const sixMonths = discounts.find(({ minimumMonths }) => minimumMonths === 6)
  const revised = await savePrepaidDiscount(db, 'owner', {
    ...sixMonths,
    action: 'edit',
    discountPercent: 12,
  })
  await assert.rejects(savePrepaidDiscount(db, 'owner', { ...sixMonths, action: 'delete' }), {
    code: 'CONFLICT',
  })
  await assert.rejects(
    savePrepaidDiscount(db, 'owner', { action: 'create', minimumMonths: 6, discountPercent: 20 }),
    { code: 'CONFLICT' },
  )
  for (const quantity of [1, 3]) {
    await assert.rejects(reservePurchase(db, 'personal', 'owner', { ...soloPrice, quantity }), {
      code: 'CONFLICT',
    })
  }
  await assert.rejects(
    reservePurchase(db, 'personal', 'owner', { ...soloPrice, revision: solo.revision - 1 }),
    { code: 'CONFLICT' },
  )
  for (const accessMonths of [0, 13, 1.5, '6']) {
    await assert.rejects(reservePurchase(db, 'personal', 'owner', { ...soloPrice, accessMonths }), {
      code: 'INVALID_INPUT',
    })
  }
  await assert.rejects(
    reservePurchase(db, 'personal', 'owner', { ...soloPrice, quotedTotal: 269460 }),
    {
      code: 'CONFLICT',
    },
  )
  t.mock.timers.enable({ apis: ['Date'], now: new Date('2027-08-31T10:30:00Z') })
  expectedAmount = 263472
  expectedTerm = '6 months'
  storedLink = undefined
  await checkoutPurchase(db, 'personal', 'owner', {
    action: 'purchase',
    ...soloPrice,
    quotedTotal: expectedAmount,
  })
  const soloPurchase = (await accountPurchases(db, 'personal')).pendingPurchase
  assert.equal(soloPurchase.quantity, 2)
  assert.equal(soloPurchase.total, expectedAmount)
  assert.equal(soloPurchase.accessMonths, 6)
  assert.equal(soloPurchase.discountPercent, 12)
  await savePrepaidDiscount(db, 'owner', { ...revised, action: 'delete' })
  const currentTiers = (await listPrepaidDiscounts(db)).map(staffDiscount)
  assert.equal(accessDiscountPercent(6, currentTiers), 5)
  assert.equal((await accountPurchases(db, 'personal')).pendingPurchase.total, expectedAmount)
  const inserted = await savePrepaidDiscount(db, 'owner', {
    action: 'create',
    minimumMonths: 7,
    discountPercent: 11,
  })
  assert.equal(inserted.minimumMonths, 7)

  storedLink.status = 'paid'
  storedLink.amount_paid = expectedAmount
  storedLink.payments = [
    {
      status: 'captured',
      amount: expectedAmount,
      payment_id: 'pay_solo1',
      created_at: Math.floor(Date.now() / 1000),
    },
  ]
  await reconcilePaymentWebhook(db, storedLink.reference_id, storedLink.id)
  const soloPayment = (await accountPurchases(db, 'personal')).lastPayment
  assert.equal(soloPayment.total, expectedAmount)
  assert.equal(soloPayment.paidThrough, Date.parse('2028-02-29T10:30:00Z'))
})

test('coupon offers respect publication, eligibility and reservations without stacking discounts', async (t) => {
  const db = createClient({ url: 'file::memory:' })
  t.after(() => db.close())
  await migrate(drizzle(db), { migrationsFolder: './drizzle' })
  for (const id of ['one', 'two']) {
    await db.batch(
      [
        {
          sql: 'INSERT INTO user (id, email, name) VALUES (?, ?, ?)',
          args: [id, `${id}@example.test`, id],
        },
        {
          sql: "INSERT INTO customer_account (id, name, account_type, personal_owner_user_id, created_at) VALUES (?, ?, 'personal', ?, 1)",
          args: [id, id, id],
        },
        {
          sql: "INSERT INTO account_membership (account_id, user_id, role, created_at) VALUES (?, ?, 'owner', 1)",
          args: [id, id],
        },
      ],
      'write',
    )
  }

  const plan = (await listLicencePlans(db, 'personal')).map(staffPlan)[0]
  const purchase = {
    planId: plan.id,
    revision: plan.revision,
    quantity: 2,
    accessMonths: 6,
    couponCode: '  save300  ',
  }
  const offer = await saveCouponOffer(db, 'one', {
    action: 'create',
    code: 'save300',
    discountAmount: 30000,
    planId: plan.id,
    audience: 'personal',
    accessMonths: 6,
    purchaseKind: 'first',
    startsAt: Date.now() - 60000,
    endsAt: Date.now() + 60000,
    redemptionLimit: 1,
  })
  assert.equal(offer.code, 'SAVE300')
  await assert.rejects(quoteCouponPurchase(db, 'one', 'one', purchase), { code: 'INVALID_INPUT' })
  await assert.rejects(
    saveCouponOffer(db, 'one', { action: 'create', code: 'SAVE300', discountAmount: 300 }),
    { code: 'CONFLICT' },
  )
  const live = await saveCouponOffer(db, 'one', { ...offer, action: 'publish' })
  await assert.rejects(quoteCouponPurchase(db, 'one', 'one', { ...purchase, accessMonths: 5 }), {
    code: 'INVALID_INPUT',
  })
  await assert.rejects(quoteCouponPurchase(db, 'one', 'two', purchase), { code: 'CONFLICT' })

  const smaller = await saveCouponOffer(db, 'one', {
    action: 'create',
    code: 'SAVE100',
    discountAmount: 10000,
  })
  await saveCouponOffer(db, 'one', { ...smaller, action: 'publish' })
  const automatic = await quoteCouponPurchase(db, 'one', 'one', {
    ...purchase,
    couponCode: 'SAVE100',
  })
  assert.equal(automatic.couponCode, null)
  assert.equal(automatic.total, 269460)

  const quote = await quoteCouponPurchase(db, 'one', 'one', purchase)
  assert.equal(quote.couponCode, 'SAVE300')
  assert.equal(quote.total, 269400)
  await assert.rejects(reservePurchase(db, 'one', 'one', { ...purchase, quotedTotal: 1 }), {
    code: 'CONFLICT',
  })
  const pending = await reservePurchase(db, 'one', 'one', { ...purchase, quotedTotal: quote.total })
  assert.equal(pending.coupon_discount, 30000)
  assert.equal(pending.discount_percent, 0)
  await assert.rejects(
    reservePurchase(db, 'two', 'two', { ...purchase, quotedTotal: quote.total }),
    { code: 'INVALID_INPUT' },
  )

  const paused = await saveCouponOffer(db, 'one', { ...live, action: 'pause' })
  assert.equal((await accountPurchases(db, 'one')).pendingPurchase.total, quote.total)
  assert.equal((await listCouponOffers(db)).find(({ code }) => code === 'SAVE300').reserved, 1)
  await assert.rejects(quoteCouponPurchase(db, 'two', 'two', purchase), { code: 'INVALID_INPUT' })
  await saveCouponOffer(db, 'one', { ...paused, action: 'publish' })
  await db.execute({
    sql: "UPDATE licence_purchase SET expires_at = ?, link_id = 'plink_capped1' WHERE id = ?",
    args: [Date.now() - 120_000, pending.id],
  })
  configureRazorpayTest(t)
  let providerAvailable = false
  t.mock.method(globalThis, 'fetch', async () =>
    providerAvailable
      ? Response.json({
          id: 'plink_capped1',
          reference_id: pending.id,
          amount: quote.total,
          currency: 'INR',
          status: 'expired',
          amount_paid: 0,
        })
      : new Response(null, { status: 503 }),
  )
  await assert.rejects(quoteCouponPurchase(db, 'two', 'two', purchase), { code: 'INVALID_INPUT' })
  assert.equal((await accountPurchases(db, 'one')).pendingPurchase.id, pending.id)
  providerAvailable = true
  assert.equal((await quoteCouponPurchase(db, 'two', 'two', purchase)).total, quote.total)
  assert.equal((await accountPurchases(db, 'one')).pendingPurchase, null)
})
