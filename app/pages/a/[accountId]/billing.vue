<script setup lang="ts">
import { parseApiError } from '~/utils/api-error'
import { licencePrice } from '~/utils/licence-price'
import {
  accessDiscountPercent,
  accessMonthsLabel,
  maximumAccessMonths,
  prepaidPrice,
} from '#shared/utils/prepaid-pricing'

definePageMeta({ layout: 'portal', key: (route) => String(route.params.accountId) })
usePrivatePageSeo('Plans & billing', 'View your MatterDraft Studio trial and device licences.')

const route = useRoute()
const accountId = String(route.params.accountId)
const billingUrl = `/api/accounts/${accountId}/billing` as const
const { data, error, pending, refresh } = await useFetch(billingUrl)
const trial = computed(() => data.value?.trial)
type Plan = NonNullable<typeof data.value>['plans'][number]
const quantities = reactive<Record<string, number | ''>>({})
const accessTerms = reactive<Record<string, string>>({})
const couponCodes = reactive<Record<string, string>>({})
const appliedCoupons = reactive<Record<string, { code: string; savings: number; total: number }>>(
  {},
)
const couponMessages = reactive<Record<string, string>>({})
const durations = Array.from({ length: maximumAccessMonths }, (_, index) => ({
  value: String(index + 1),
  label: accessMonthsLabel(index + 1),
}))
const termOptions = computed(() =>
  durations.map((duration) => {
    const discount = accessDiscountPercent(Number(duration.value), data.value?.discounts ?? [])
    return {
      ...duration,
      label: duration.label + (discount ? ` · ${discount}% off` : ''),
    }
  }),
)
const busy = ref(false)
const problem = ref('')
const notice = ref('')

function quantity(plan: Plan) {
  return plan.accountType === 'personal'
    ? plan.minimumDevices
    : (quantities[plan.id] ?? plan.minimumDevices)
}

function validQuantity(plan: Plan) {
  if (plan.accountType === 'personal') return true
  const value = quantity(plan)
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= plan.minimumDevices &&
    value <= (data.value?.maxDeviceQuantity ?? 1)
  )
}

const quotes = computed(() =>
  Object.fromEntries(
    (data.value?.plans ?? []).map((plan) => {
      const months = Number(accessTerms[plan.id] ?? 1)
      const monthlyAmount =
        plan.monthlyPrice * (plan.accountType === 'personal' ? 1 : Number(quantity(plan)))
      const discount = accessDiscountPercent(months, data.value?.discounts ?? [])
      return [plan.id, prepaidPrice(monthlyAmount, months, discount)]
    }),
  ),
)

function clearCoupon(plan: Plan) {
  delete appliedCoupons[plan.id]
  delete couponMessages[plan.id]
}

function removeCoupon(plan: Plan) {
  clearCoupon(plan)
  delete couponCodes[plan.id]
}

function changeQuantity(plan: Plan, value: number) {
  quantities[plan.id] = value || ''
  resetCouponForSelection(plan)
}

function changeTerm(plan: Plan, value: string | undefined) {
  accessTerms[plan.id] = value ?? '1'
  resetCouponForSelection(plan)
}

function resetCouponForSelection(plan: Plan) {
  const hadCoupon = Boolean(appliedCoupons[plan.id])
  clearCoupon(plan)
  if (hadCoupon) couponMessages[plan.id] = 'Apply the code again for your new selection.'
}

async function applyCoupon(plan: Plan) {
  if (busy.value || !validQuantity(plan) || !couponCodes[plan.id]?.trim()) return
  clearCoupon(plan)
  busy.value = true
  try {
    const { quote } = await $fetch(`/api/accounts/${accountId}/checkout`, {
      method: 'POST',
      body: {
        action: 'quote-coupon',
        planId: plan.id,
        revision: plan.revision,
        quantity: quantity(plan),
        accessMonths: Number(accessTerms[plan.id] ?? 1),
        couponCode: couponCodes[plan.id],
      },
    })
    if (quote?.couponCode) {
      appliedCoupons[plan.id] = {
        code: quote.couponCode,
        savings: quote.couponDiscount,
        total: quote.total,
      }
      couponCodes[plan.id] = quote.couponCode
    } else if (quote) {
      couponMessages[plan.id] = 'Your prepaid discount gives you the best price.'
    }
  } catch (reason) {
    const failure = parseApiError(reason)
    couponMessages[plan.id] =
      failure.status === 422
        ? 'This code is unavailable for the selected plan, duration, or account.'
        : failure.text
    if (failure.status === 409) await refresh()
  } finally {
    busy.value = false
  }
}

async function checkout(action: 'purchase' | 'check' | 'resume', plan?: Plan) {
  if (action === 'purchase' && (!plan || !data.value?.canPurchase || !validQuantity(plan))) return
  busy.value = true
  problem.value = ''
  notice.value = ''
  const coupon = plan && appliedCoupons[plan.id]
  try {
    const { checkoutUrl } = await $fetch(`/api/accounts/${accountId}/checkout`, {
      method: 'POST',
      body: {
        action,
        planId: plan?.id,
        revision: plan?.revision,
        quantity: plan && quantity(plan),
        accessMonths: plan && Number(accessTerms[plan.id] ?? 1),
        couponCode: coupon?.code,
        quotedTotal: coupon?.total ?? (plan && quotes.value[plan.id]?.total),
      },
    })
    if (checkoutUrl && action !== 'check') {
      window.location.assign(checkoutUrl)
      return
    }
    await refresh()
    if (data.value?.pendingPurchase) notice.value = 'Payment is still pending.'
    else if (data.value?.canPurchase) notice.value = 'There is no open payment.'
  } catch (reason) {
    const failure = parseApiError(reason)
    if (plan) clearCoupon(plan)
    await refresh()
    problem.value =
      action === 'purchase' &&
      (failure.status === 409 || (coupon && failure.status === 422)) &&
      !error.value
        ? 'Checkout details changed. Review the latest total or payment status before continuing.'
        : failure.text
  } finally {
    busy.value = false
  }
}

onMounted(async () => {
  if (route.query.checkout !== 'return' || !data.value?.checkoutEnabled) return
  await useRouter().replace({ path: route.path })
  if (data.value.pendingPurchase) await checkout('check')
})

async function startTrial() {
  busy.value = true
  problem.value = ''
  try {
    const { trial } = await $fetch(`/api/accounts/${accountId}/trial`, { method: 'POST', body: {} })
    if (data.value) data.value = { ...data.value, trial, canStartTrial: false }
  } catch (reason) {
    problem.value = parseApiError(reason).text
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="portal-content customer-content customer-page">
    <header class="customer-page-heading">
      <h1 class="heading-4">Plans &amp; billing</h1>
      <p class="body-3">Review your access and choose a prepaid term.</p>
    </header>
    <div v-if="error" role="alert" class="portal-error">
      {{ parseApiError(error).text }}
      <button class="portal-link ml-2" type="button" @click="refresh()">Try again</button>
    </div>
    <div v-else-if="pending && !data" class="customer-loading-panel" role="status" aria-busy="true">
      <span class="sr-only">Loading plans and billing</span>
    </div>
    <template v-else-if="data">
      <p v-if="problem" class="portal-error customer-message" role="alert">{{ problem }}</p>
      <p v-if="notice" class="portal-notice customer-message" role="status">{{ notice }}</p>
      <section
        v-if="data.lastPayment || data.pendingPurchase"
        class="customer-section customer-section-first"
        aria-labelledby="payment-heading"
      >
        <h2 id="payment-heading" class="title-3">Payment status</h2>
        <div class="billing-payments">
          <template v-for="payment in [data.lastPayment, data.pendingPurchase]" :key="payment?.id">
            <article v-if="payment" class="customer-panel">
              <header class="customer-panel-heading">
                <h3 class="title-3">{{ payment.planName }}</h3>
                <span
                  class="customer-status caption-3"
                  :class="payment.status === 'pending' ? 'status-pending' : 'status-positive'"
                  >{{
                    payment.status === 'pending' ? 'Payment pending' : 'Test payment received'
                  }}</span
                >
              </header>
              <div class="customer-panel-body">
                <dl class="billing-payment-facts body-6">
                  <div>
                    <dt>Devices</dt>
                    <dd>{{ payment.quantity }}</dd>
                  </div>
                  <div>
                    <dt>Access duration</dt>
                    <dd>{{ accessMonthsLabel(payment.accessMonths) }}</dd>
                  </div>
                  <div>
                    <dt>Total including GST</dt>
                    <dd>{{ licencePrice(payment.total) }}</dd>
                  </div>
                </dl>
                <p v-if="payment.couponCode" class="customer-muted body-6">
                  Coupon {{ payment.couponCode }} saved {{ licencePrice(payment.couponDiscount) }}.
                </p>
                <p v-if="payment.paidThrough" class="customer-muted body-6">
                  Period ends
                  <NuxtTime
                    :datetime="payment.paidThrough"
                    date-style="medium"
                    time-style="short"
                  />.
                </p>
                <div
                  v-if="payment.status === 'pending' && data.checkoutEnabled"
                  class="customer-form-actions"
                >
                  <button
                    type="button"
                    class="workspace-primary button-sm"
                    :disabled="busy"
                    :aria-busy="busy"
                    @click="checkout('resume')"
                  >
                    Continue test payment
                  </button>
                  <button
                    type="button"
                    class="portal-button-secondary button-sm"
                    :disabled="busy"
                    @click="checkout('check')"
                  >
                    Check payment status
                  </button>
                </div>
              </div>
            </article>
          </template>
        </div>
      </section>
      <section v-if="trial" class="billing-trial customer-panel" aria-labelledby="trial-heading">
        <div>
          <h2 id="trial-heading" class="title-3">Seven day free trial</h2>
          <p v-if="trial.status === 'active'" class="body-6">
            Full access ends
            <NuxtTime :datetime="trial.expiresAt" date-style="medium" time-style="short" />.
          </p>
          <p v-else-if="trial.status === 'ended'" class="body-6">
            Trial ended
            <NuxtTime :datetime="trial.expiresAt" date-style="medium" time-style="short" />.
          </p>
          <p v-else class="body-6">
            Your trial begins when you start it. No payment details required.
          </p>
        </div>
        <button
          v-if="data.canStartTrial"
          type="button"
          class="portal-button-secondary button-sm"
          :disabled="busy"
          :aria-busy="busy"
          @click="startTrial()"
        >
          Start free trial
        </button>
        <span
          v-else
          class="customer-status caption-3"
          :class="trial.status === 'active' ? 'status-positive' : undefined"
          >{{
            trial.status === 'active'
              ? 'Active'
              : trial.status === 'ended'
                ? 'Ended'
                : 'Not started'
          }}</span
        >
      </section>
      <section class="customer-section" aria-labelledby="available-plans">
        <div class="customer-section-heading">
          <h2 id="available-plans" class="title-3">Available plans</h2>
          <p v-if="data.plans.length" class="body-6">
            Pay once for the term you choose. Access ends automatically.
          </p>
        </div>
        <div v-if="!data.plans.length" class="customer-empty">
          <p class="body-6">No paid plans are available for this account yet.</p>
        </div>
        <ul v-else class="billing-plans">
          <li v-for="plan in data.plans" :key="plan.id" class="billing-plan customer-panel">
            <div class="billing-plan-description">
              <h3 :id="`plan-${plan.id}`" class="heading-5">{{ plan.name }}</h3>
              <p class="body-6 billing-description">{{ plan.description }}</p>
              <p class="billing-rate">
                <strong class="heading-5">{{ licencePrice(plan.monthlyPrice) }}</strong><span
                  class="body-6"
                  >{{ plan.accountType === 'personal' ? '/ month' : '/ device / month' }}</span
                >
              </p>
              <p class="customer-muted body-6">Including GST</p>
              <p v-if="plan.accountType === 'personal'" class="billing-device-note body-6">
                {{ plan.minimumDevices }}
                {{ plan.minimumDevices === 1 ? 'device' : 'devices' }} included
              </p>
              <p v-else class="billing-device-note body-6">
                {{ plan.minimumDevices }} device minimum ·
                {{ licencePrice(plan.monthlyPrice * plan.minimumDevices) }} / month including GST
              </p>
            </div>
            <form
              v-if="data.canChooseTerm && !data.pendingPurchase"
              class="billing-plan-form"
              :aria-labelledby="`plan-${plan.id}`"
              @submit.prevent="checkout('purchase', plan)"
            >
              <div
                class="billing-selection"
                :class="{ 'billing-selection-team': plan.accountType === 'organisation' }"
              >
                <div v-if="plan.accountType === 'organisation'" class="customer-field">
                  <label :for="`device-count-${plan.id}`" class="title-4">Number of devices</label>
                  <StudioField
                    ><input
                      :id="`device-count-${plan.id}`"
                      :value="quantity(plan)"
                      class="portal-input"
                      type="number"
                      :min="plan.minimumDevices"
                      :max="data.maxDeviceQuantity"
                      :disabled="busy"
                      :aria-invalid="!validQuantity(plan) || undefined"
                      required
                      @input="
                        changeQuantity(plan, ($event.target as HTMLInputElement).valueAsNumber)
                      "
                  /></StudioField>
                </div>
                <div class="customer-field">
                  <label :for="`access-term-${plan.id}`" class="title-4">Access duration</label>
                  <StudioSelect
                    :id="`access-term-${plan.id}`"
                    :model-value="accessTerms[plan.id] ?? '1'"
                    :options="termOptions"
                    :display-label="
                      appliedCoupons[plan.id]
                        ? accessMonthsLabel(Number(accessTerms[plan.id] ?? 1))
                        : undefined
                    "
                    :disabled="busy"
                    class="portal-input normal-case!"
                    @update:model-value="changeTerm(plan, $event)"
                  />
                </div>
              </div>
              <details class="billing-coupon">
                <summary class="body-6">
                  {{ appliedCoupons[plan.id] ? 'Coupon applied' : 'Add a coupon code' }}
                </summary>
                <div class="customer-field">
                  <label :for="`coupon-code-${plan.id}`" class="title-4">Coupon code</label>
                  <div class="billing-coupon-input">
                    <StudioField
                      ><input
                        :id="`coupon-code-${plan.id}`"
                        v-model="couponCodes[plan.id]"
                        class="portal-input"
                        maxlength="32"
                        autocomplete="off"
                        :disabled="busy"
                        @input="clearCoupon(plan)"
                        @keydown.enter.prevent="applyCoupon(plan)"
                    /></StudioField>
                    <button
                      v-if="appliedCoupons[plan.id]"
                      type="button"
                      class="portal-button-secondary button-sm"
                      :disabled="busy"
                      @click="removeCoupon(plan)"
                    >
                      Remove code
                    </button>
                    <button
                      v-else
                      type="button"
                      class="portal-button-secondary button-sm"
                      :disabled="busy || !validQuantity(plan) || !couponCodes[plan.id]?.trim()"
                      @click="applyCoupon(plan)"
                    >
                      Apply code
                    </button>
                  </div>
                </div>
              </details>
              <p v-if="couponMessages[plan.id]" class="customer-muted body-6" role="status">
                {{ couponMessages[plan.id] }}
              </p>
              <div
                v-if="validQuantity(plan) && quotes[plan.id]"
                class="billing-summary"
                aria-live="polite"
              >
                <dl class="body-6">
                  <div>
                    <dt>Subtotal · {{ accessMonthsLabel(Number(accessTerms[plan.id] ?? 1)) }}</dt>
                    <dd>{{ licencePrice(quotes[plan.id]!.subtotal) }}</dd>
                  </div>
                  <div v-if="appliedCoupons[plan.id]" class="billing-saving">
                    <dt>Coupon {{ appliedCoupons[plan.id]!.code }}</dt>
                    <dd>−{{ licencePrice(appliedCoupons[plan.id]!.savings) }}</dd>
                  </div>
                  <div v-else-if="quotes[plan.id]!.savings" class="billing-saving">
                    <dt>Prepaid discount ({{ quotes[plan.id]!.discountPercent }}%)</dt>
                    <dd>−{{ licencePrice(quotes[plan.id]!.savings) }}</dd>
                  </div>
                  <div class="billing-total">
                    <dt>Total including GST</dt>
                    <dd>
                      {{ licencePrice(appliedCoupons[plan.id]?.total ?? quotes[plan.id]!.total) }}
                    </dd>
                  </div>
                </dl>
              </div>
              <p v-else class="portal-error" role="status">
                Enter between {{ plan.minimumDevices }} and {{ data.maxDeviceQuantity }} devices to
                calculate your total.
              </p>
              <button
                v-if="data.canPurchase"
                type="submit"
                class="workspace-primary button-sm"
                :disabled="busy || !validQuantity(plan)"
                :aria-busy="busy"
              >
                Continue to test checkout
              </button>
            </form>
          </li>
        </ul>
        <p v-if="data.plans.length" class="billing-availability body-6">
          {{
            data.checkoutEnabled
              ? 'Razorpay test mode. Use test payment details.'
              : 'Online purchases are currently unavailable.'
          }}
        </p>
      </section>
    </template>
  </div>
</template>
