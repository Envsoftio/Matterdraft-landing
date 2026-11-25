<script setup lang="ts">
import { accessMonthsLabel, maximumAccessMonths } from '#shared/utils/prepaid-pricing'
import { parseApiError } from '~/utils/api-error'
import { licencePrice } from '~/utils/licence-price'

type Offer = {
  id: string
  revision: number
  code: string
  discountAmount: number
  status: 'draft' | 'published' | 'paused'
  planId: string | null
  audience: string | null
  accessMonths: number | null
  purchaseKind: string | null
  startsAt: number | null
  endsAt: number | null
  redemptionLimit: number | null
  reserved: number
  redeemed: number
}
const props = defineProps<{
  offers: Offer[]
  plans: { id: string; name: string }[]
  refreshOffers: () => Promise<void>
}>()
const editor = ref<{
  id?: string
  revision?: number
  code: string
  amount: string
  planId: string
  audience: string
  accessMonths: string
  purchaseKind: string
  startsAt: string
  endsAt: string
  redemptionLimit: string
}>()
const codeField = ref<HTMLInputElement>()
const problem = ref('')
const notice = ref('')
const busy = ref(false)
const monthOptions = Array.from({ length: maximumAccessMonths }, (_, i) => ({
  value: String(i + 1),
  label: accessMonthsLabel(i + 1),
}))
const purchaseOptions = [
  { value: '', label: 'Any purchase' },
  { value: 'first', label: 'First purchase' },
  { value: 'renewal', label: 'Returning customer' },
]
const audienceOptions = [
  { value: '', label: 'All accounts' },
  { value: 'personal', label: 'Personal accounts' },
  { value: 'organisation', label: 'Organisation accounts' },
]
const planOptions = computed(() => [
  { value: '', label: 'All plans' },
  ...props.plans.map((plan) => ({ value: plan.id, label: plan.name })),
])

function localTime(instant: number | null) {
  if (instant === null) return ''
  const date = new Date(instant)
  return new Date(instant - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

async function edit(offer?: Offer) {
  problem.value = ''
  notice.value = ''
  editor.value = {
    id: offer?.id,
    revision: offer?.revision,
    code: offer?.code ?? '',
    amount: offer ? String(offer.discountAmount / 100) : '',
    planId: offer?.planId ?? '',
    audience: offer?.audience ?? '',
    accessMonths: String(offer?.accessMonths ?? ''),
    purchaseKind: offer?.purchaseKind ?? '',
    startsAt: localTime(offer?.startsAt ?? null),
    endsAt: localTime(offer?.endsAt ?? null),
    redemptionLimit: String(offer?.redemptionLimit ?? ''),
  }
  await nextTick()
  codeField.value?.focus()
}

async function update(body: Record<string, unknown>, message: string) {
  busy.value = true
  problem.value = ''
  notice.value = ''
  try {
    await $fetch('/api/internal/coupon-offers', { method: 'POST', body })
    editor.value = undefined
    await props.refreshOffers()
    notice.value = message
  } catch (reason) {
    const failure = parseApiError(reason)
    problem.value = failure.text
    if (failure.status === 409) await props.refreshOffers()
  } finally {
    busy.value = false
  }
}

function save() {
  const draft = editor.value
  if (!draft) return
  if (!/^\d{1,6}(?:\.\d{1,2})?$/.test(draft.amount.trim()) || Number(draft.amount) <= 0) {
    problem.value = 'Enter a discount in rupees with up to two decimal places.'
    return
  }
  const startsAt = draft.startsAt ? Date.parse(draft.startsAt) : null
  const endsAt = draft.endsAt ? Date.parse(draft.endsAt) : null
  if (startsAt !== null && endsAt !== null && endsAt <= startsAt) {
    problem.value = 'The end must come after the start.'
    return
  }
  return update(
    {
      action: draft.id ? 'edit' : 'create',
      id: draft.id,
      revision: draft.revision,
      code: draft.code,
      discountAmount: Math.round(Number(draft.amount) * 100),
      planId: draft.planId || null,
      audience: draft.audience || null,
      accessMonths: draft.accessMonths ? Number(draft.accessMonths) : null,
      purchaseKind: draft.purchaseKind || null,
      startsAt,
      endsAt,
      redemptionLimit: draft.redemptionLimit ? Number(draft.redemptionLimit) : null,
    },
    draft.id ? 'Offer updated.' : 'Draft offer saved.',
  )
}
</script>

<template>
  <section class="portal-detail mt-8" aria-labelledby="coupon-offers-heading">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 id="coupon-offers-heading" class="font-heading text-xl font-semibold">Coupon offers</h2>
        <p class="mt-1 text-sm text-studio-muted">
          Publish a code, then share it with eligible customers.
        </p>
      </div>
      <button
        type="button"
        class="portal-button-secondary"
        :disabled="busy || !!editor"
        @click="edit()"
      >
        New offer
      </button>
    </div>

    <p v-if="notice" class="portal-notice mt-4" role="status">{{ notice }}</p>
    <p v-if="problem" class="portal-error mt-4" role="alert">{{ problem }}</p>
    <form
      v-if="editor"
      class="mt-5 space-y-4 rounded-lg border border-studio-rule p-4"
      @submit.prevent="save"
    >
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="min-w-0">
          <label for="offer-code" class="portal-label">Coupon code</label>
          <StudioField>
            <input
              id="offer-code"
              ref="codeField"
              v-model.trim="editor.code"
              class="portal-input"
              maxlength="32"
              pattern="[A-Za-z0-9][A-Za-z0-9_\x2D]{2,31}"
              required
            />
          </StudioField>
          <p class="mt-1 text-xs text-studio-muted">
            3 to 32 characters. Letters, numbers, underscores and hyphens.
          </p>
        </div>
        <div class="min-w-0">
          <label for="offer-amount" class="portal-label">Discount (₹)</label>
          <StudioField
            ><input
              id="offer-amount"
              v-model="editor.amount"
              class="portal-input"
              inputmode="decimal"
              maxlength="9"
              required
          /></StudioField>
        </div>
      </div>
      <details
        class="rounded-lg border border-studio-rule p-4"
        :open="editor.id ? true : undefined"
      >
        <summary class="cursor-pointer text-sm font-semibold">Eligibility and limits</summary>
        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <div class="min-w-0">
            <label for="offer-plan" class="portal-label">Eligible plan</label>
            <StudioSelect
              id="offer-plan"
              v-model="editor.planId"
              class="portal-input normal-case!"
              :options="planOptions"
            />
          </div>
          <div class="min-w-0">
            <label for="offer-audience" class="portal-label">Eligible accounts</label>
            <StudioSelect
              id="offer-audience"
              v-model="editor.audience"
              class="portal-input normal-case!"
              :options="audienceOptions"
            />
          </div>
          <div class="min-w-0">
            <label for="offer-term" class="portal-label">Access duration</label>
            <StudioSelect
              id="offer-term"
              v-model="editor.accessMonths"
              class="portal-input normal-case!"
              :options="[{ value: '', label: 'Any duration' }, ...monthOptions]"
            />
          </div>
          <div class="min-w-0">
            <label for="offer-purchase" class="portal-label">Purchase type</label>
            <StudioSelect
              id="offer-purchase"
              v-model="editor.purchaseKind"
              class="portal-input normal-case!"
              :options="purchaseOptions"
            />
          </div>
          <div class="min-w-0">
            <label for="offer-start" class="portal-label">Starts (local time)</label>
            <StudioField
              ><input
                id="offer-start"
                v-model="editor.startsAt"
                class="portal-input"
                type="datetime-local"
            /></StudioField>
          </div>
          <div class="min-w-0">
            <label for="offer-end" class="portal-label">Ends (local time)</label>
            <StudioField
              ><input
                id="offer-end"
                v-model="editor.endsAt"
                class="portal-input"
                type="datetime-local"
            /></StudioField>
          </div>
          <div class="min-w-0">
            <label for="offer-limit" class="portal-label">Redemption cap</label>
            <StudioField
              ><input
                id="offer-limit"
                v-model="editor.redemptionLimit"
                class="portal-input"
                type="number"
                min="1"
                max="1000000"
                placeholder="Unlimited"
            /></StudioField>
          </div>
        </div>
      </details>
      <div class="flex flex-wrap gap-3">
        <button type="submit" class="portal-button" :disabled="busy">
          {{ editor.id ? 'Save offer' : 'Save draft offer' }}
        </button>
        <button
          type="button"
          class="portal-button-secondary"
          :disabled="busy"
          @click="editor = undefined"
        >
          Cancel
        </button>
      </div>
    </form>

    <ul v-if="offers.length" class="mt-4 divide-y divide-studio-rule">
      <li
        v-for="offer in offers"
        :key="offer.id"
        class="flex flex-wrap items-center justify-between gap-3 py-4 last:pb-0"
      >
        <div class="min-w-0">
          <p class="text-sm break-all">
            <strong>{{ offer.code }}</strong> · {{ licencePrice(offer.discountAmount) }} off
          </p>
          <p class="mt-1 text-sm text-studio-muted">
            <span class="capitalize">{{ offer.status }}</span> · {{ offer.redeemed }} redeemed ·
            {{ offer.reserved }} reserved<span v-if="offer.redemptionLimit">
              · {{ offer.redemptionLimit }} limit</span
            >
          </p>
          <p v-if="offer.startsAt || offer.endsAt" class="mt-1 text-sm text-studio-muted">
            <span v-if="offer.startsAt"
              >Starts <NuxtTime :datetime="offer.startsAt" date-style="medium" time-style="short"
            /></span>
            <span v-if="offer.startsAt && offer.endsAt"> · </span>
            <span v-if="offer.endsAt"
              >Ends <NuxtTime :datetime="offer.endsAt" date-style="medium" time-style="short"
            /></span>
          </p>
        </div>
        <div class="flex flex-wrap gap-3">
          <button
            type="button"
            class="portal-button-secondary"
            :disabled="busy || !!editor"
            :aria-label="`Edit ${offer.code}`"
            @click="edit(offer)"
          >
            Edit
          </button>
          <button
            type="button"
            class="portal-button-secondary"
            :disabled="busy || !!editor"
            :aria-label="`${offer.status === 'published' ? 'Pause' : 'Publish'} ${offer.code}`"
            @click="
              update(
                {
                  action: offer.status === 'published' ? 'pause' : 'publish',
                  id: offer.id,
                  revision: offer.revision,
                },
                offer.status === 'published' ? 'Offer paused.' : 'Offer published.',
              )
            "
          >
            {{ offer.status === 'published' ? 'Pause' : 'Publish' }}
          </button>
        </div>
      </li>
    </ul>
    <p v-else class="mt-4 text-sm text-studio-muted">No coupon offers yet.</p>
  </section>
</template>
