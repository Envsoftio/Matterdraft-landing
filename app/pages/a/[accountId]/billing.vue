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
const { data, error, refresh } = await useFetch(billingUrl)
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
  <div class="portal-content">
    <h1 class="portal-page-title">Plans &amp; billing</h1>
    <div v-if="error" role="alert" class="portal-error mt-6">
      {{ parseApiError(error).text }}
      <button class="portal-link ml-2" type="button" @click="refresh()">Try again</button>
    </div>
    <template v-else-if="data">
      <p v-if="problem" class="portal-error mt-5" role="alert">{{ problem }}</p>
      <p v-if="notice" class="portal-notice mt-5" role="status">{{ notice }}</p>
      <section
        v-if="data.lastPayment || data.pendingPurchase"
        class="portal-detail mt-7"
        aria-labelledby="payment-heading"
      >
        <h2 id="payment-heading" class="font-heading text-xl font-semibold">Payment status</h2>
        <div v-if="data.lastPayment" class="mt-3 text-sm">
          <p>
            {{ data.lastPayment.planName }} · {{ data.lastPayment.quantity }}
            {{ data.lastPayment.quantity === 1 ? 'device' : 'devices' }} ·
            {{ accessMonthsLabel(data.lastPayment.accessMonths) }} ·
            {{ licencePrice(data.lastPayment.total) }} (incl. GST) paid in test mode
          </p>
          <p v-if="data.lastPayment.couponCode" class="mt-1 text-studio-muted">
            Coupon {{ data.lastPayment.couponCode }} saved
            {{ licencePrice(data.lastPayment.couponDiscount) }}
          </p>
          <p class="mt-1 text-studio-muted">
            Period ends
            <NuxtTime
              :datetime="data.lastPayment.paidThrough!"
              date-style="medium"
              time-style="short"
            />
          </p>
        </div>
        <div v-if="data.pendingPurchase" class="mt-3 text-sm">
          <p>
            {{ data.pendingPurchase.planName }} · {{ data.pendingPurchase.quantity }}
            {{ data.pendingPurchase.quantity === 1 ? 'device' : 'devices' }} ·
            {{ accessMonthsLabel(data.pendingPurchase.accessMonths) }} ·
            {{ licencePrice(data.pendingPurchase.total) }} (incl. GST) pending
          </p>
          <p v-if="data.pendingPurchase.couponCode" class="mt-1 text-studio-muted">
            Coupon {{ data.pendingPurchase.couponCode }} saved
            {{ licencePrice(data.pendingPurchase.couponDiscount) }}
          </p>
          <div v-if="data.checkoutEnabled" class="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              class="portal-button"
              :disabled="busy"
              @click="checkout('resume')"
            >
              Continue test payment
            </button>
            <button
              type="button"
              class="portal-button-secondary"
              :disabled="busy"
              @click="checkout('check')"
            >
              Check payment status
            </button>
          </div>
        </div>
      </section>
      <section v-if="trial" class="portal-detail mt-7" aria-labelledby="trial-heading">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 id="trial-heading" class="font-heading text-xl font-semibold">7-day free trial</h2>
            <p v-if="trial.status === 'active'" class="mt-2 text-sm text-studio-muted">
              Full access ends
              <NuxtTime :datetime="trial.expiresAt" date-style="medium" time-style="short" />
            </p>
            <p v-else-if="trial.status === 'ended'" class="mt-2 text-sm text-studio-muted">
              Trial ended
              <NuxtTime :datetime="trial.expiresAt" date-style="medium" time-style="short" />
            </p>
            <p v-else class="mt-2 text-sm text-studio-muted">
              Get full access for seven days from the moment you start. No payment details required.
            </p>
          </div>
          <button
            v-if="data.canStartTrial"
            type="button"
            class="portal-button"
            :disabled="busy"
            @click="startTrial()"
          >
            Start free trial
          </button>
        </div>
      </section>
      <section class="mt-9" aria-labelledby="available-plans">
        <h2 id="available-plans" class="font-heading text-xl font-semibold">Available plans</h2>
        <p v-if="data.plans.length" class="mt-2 text-sm text-studio-muted">
          Choose how long you need access. Pay once for the term you choose. Access ends
          automatically.
        </p>
        <p v-if="!data.plans.length" class="mt-3 text-sm text-studio-muted">
          No paid plans are available for this account yet.
        </p>
        <ul v-else class="mt-4 grid max-w-4xl grid-cols-1 gap-5 sm:grid-cols-2">
          <li v-for="plan in data.plans" :key="plan.id" class="portal-detail flex min-w-0 flex-col">
            <h3 class="break-words font-heading text-lg font-semibold">{{ plan.name }}</h3>
            <p class="mt-2 flex-1 break-words whitespace-pre-line text-sm text-studio-muted">
              {{ plan.description }}
            </p>
            <p class="mt-5 text-sm text-studio-muted">
              <strong
                class="font-heading text-2xl font-semibold tabular-nums text-studio-heading"
                >{{ licencePrice(plan.monthlyPrice) }}</strong
              >
              {{ plan.accountType === 'personal' ? '/ month' : '/ device / month' }}
              · incl. GST
            </p>
            <p v-if="plan.accountType === 'personal'" class="mt-1 text-sm text-studio-muted">
              {{ plan.minimumDevices }}
              {{ plan.minimumDevices === 1 ? 'device' : 'devices' }} included
            </p>
            <p v-else-if="plan.minimumDevices > 1" class="mt-1 text-sm text-studio-muted">
              {{ plan.minimumDevices }} device minimum ·
              {{ licencePrice(plan.monthlyPrice * plan.minimumDevices) }} / month incl. GST
            </p>
            <form
              v-if="data.canChooseTerm && !data.pendingPurchase"
              class="mt-5 space-y-4"
              @submit.prevent="checkout('purchase', plan)"
            >
              <div v-if="plan.accountType === 'organisation'">
                <label :for="`device-count-${plan.id}`" class="portal-label"
                  >Number of devices</label
                >
                <StudioField>
                  <input
                    :id="`device-count-${plan.id}`"
                    :value="quantity(plan)"
                    class="portal-input"
                    type="number"
                    :min="plan.minimumDevices"
                    :max="data.maxDeviceQuantity"
                    :disabled="busy"
                    required
                    @input="changeQuantity(plan, ($event.target as HTMLInputElement).valueAsNumber)"
                  />
                </StudioField>
              </div>
              <div>
                <label :for="`access-term-${plan.id}`" class="portal-label">Access duration</label>
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
              <div>
                <label :for="`coupon-code-${plan.id}`" class="portal-label">Coupon code</label>
                <div class="flex flex-wrap items-end gap-2">
                  <StudioField class="min-w-0 flex-1">
                    <input
                      :id="`coupon-code-${plan.id}`"
                      v-model="couponCodes[plan.id]"
                      class="portal-input"
                      maxlength="32"
                      autocomplete="off"
                      :disabled="busy"
                      @input="clearCoupon(plan)"
                      @keydown.enter.prevent="applyCoupon(plan)"
                    />
                  </StudioField>
                  <button
                    v-if="appliedCoupons[plan.id]"
                    type="button"
                    class="portal-button-secondary"
                    :disabled="busy"
                    @click="removeCoupon(plan)"
                  >
                    Remove code
                  </button>
                  <button
                    v-else
                    type="button"
                    class="portal-button-secondary"
                    :disabled="busy || !validQuantity(plan) || !couponCodes[plan.id]?.trim()"
                    @click="applyCoupon(plan)"
                  >
                    Apply code
                  </button>
                </div>
                <p
                  v-if="couponMessages[plan.id]"
                  class="mt-2 text-sm text-studio-muted"
                  role="status"
                >
                  {{ couponMessages[plan.id] }}
                </p>
              </div>
              <div
                v-if="validQuantity(plan) && quotes[plan.id]"
                class="space-y-1 text-sm tabular-nums"
                aria-live="polite"
              >
                <p v-if="appliedCoupons[plan.id]" class="text-studio-muted">
                  {{ appliedCoupons[plan.id]!.code }} applied · Save
                  {{ licencePrice(appliedCoupons[plan.id]!.savings) }}
                </p>
                <p v-else-if="quotes[plan.id]!.savings" class="text-studio-muted">
                  Save {{ licencePrice(quotes[plan.id]!.savings) }} ({{
                    quotes[plan.id]!.discountPercent
                  }}% off {{ licencePrice(quotes[plan.id]!.subtotal) }})
                </p>
                <p>
                  <strong>{{
                    licencePrice(appliedCoupons[plan.id]?.total ?? quotes[plan.id]!.total)
                  }}</strong>
                  total for
                  {{ accessMonthsLabel(Number(accessTerms[plan.id] ?? 1)) }}
                  <span class="text-studio-muted">(incl. GST)</span>
                </p>
              </div>
              <button
                v-if="data.canPurchase"
                type="submit"
                class="portal-button"
                :disabled="busy || !validQuantity(plan)"
              >
                Continue to test checkout
              </button>
            </form>
          </li>
        </ul>
        <p v-if="data.plans.length" class="mt-4 text-sm text-studio-muted">
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
