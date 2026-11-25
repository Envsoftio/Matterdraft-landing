<script setup lang="ts">
import {
  accessMonthsLabel,
  maximumAccessMonths,
  type PrepaidDiscount,
} from '#shared/utils/prepaid-pricing'
import { parseApiError } from '~/utils/api-error'

type Discount = PrepaidDiscount & { id: string; revision: number }
const props = defineProps<{ discounts: Discount[]; refreshDiscounts: () => Promise<void> }>()
const form = ref<{
  id?: string
  revision?: number
  minimumMonths: number | ''
  discountPercent: number | ''
}>()
const removing = ref<Discount>()
const busy = ref(false)
const problem = ref('')
const notice = ref('')
const minimumField = ref<HTMLInputElement>()

async function edit(discount?: Discount) {
  removing.value = undefined
  notice.value = ''
  problem.value = ''
  form.value = discount ? { ...discount } : { minimumMonths: '', discountPercent: '' }
  await nextTick()
  minimumField.value?.focus()
}

function confirmRemoval(discount: Discount) {
  removing.value = discount
  notice.value = ''
  problem.value = ''
}

function cancelEdit() {
  form.value = undefined
  problem.value = ''
}

async function update(
  action: 'create' | 'edit' | 'delete',
  discount: NonNullable<typeof form.value>,
) {
  if (
    action !== 'delete' &&
    props.discounts.some(
      (tier) => tier.minimumMonths === discount.minimumMonths && tier.id !== discount.id,
    )
  ) {
    problem.value = 'A discount already starts at that duration.'
    return
  }

  busy.value = true
  problem.value = ''
  notice.value = ''
  try {
    await $fetch('/api/internal/prepaid-discounts', {
      method: 'POST',
      body: { action, ...discount },
    })
    form.value = undefined
    removing.value = undefined
    await props.refreshDiscounts()
    notice.value = action === 'delete' ? 'Discount removed.' : 'Discount saved.'
  } catch (reason) {
    const failure = parseApiError(reason)
    problem.value = failure.text
    if (failure.status === 409) {
      form.value = undefined
      removing.value = undefined
      await props.refreshDiscounts()
    }
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <section class="portal-detail mt-8" aria-labelledby="prepaid-discounts-heading">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 id="prepaid-discounts-heading" class="font-heading text-xl font-semibold">
          Prepaid discounts
        </h2>
        <p class="mt-1 text-sm text-studio-muted">
          Applies to all plans. A purchase uses the tier with the longest minimum duration it meets.
        </p>
      </div>
      <button
        type="button"
        class="portal-button-secondary"
        :disabled="busy || !!removing"
        @click="edit()"
      >
        Add discount
      </button>
    </div>

    <p v-if="notice" class="portal-notice mt-4" role="status">{{ notice }}</p>
    <p v-if="problem" class="portal-error mt-4" role="alert">{{ problem }}</p>

    <form
      v-if="form"
      class="mt-5 flex flex-wrap items-end gap-4 rounded-lg border border-studio-rule p-4"
      @submit.prevent="update(form.id ? 'edit' : 'create', form)"
    >
      <div>
        <label for="discount-months" class="portal-label">Minimum months</label>
        <StudioField>
          <input
            id="discount-months"
            ref="minimumField"
            v-model.number="form.minimumMonths"
            class="portal-input"
            type="number"
            min="1"
            :max="maximumAccessMonths"
            required
          />
        </StudioField>
      </div>
      <div>
        <label for="discount-percent" class="portal-label">Discount (%)</label>
        <StudioField>
          <input
            id="discount-percent"
            v-model.number="form.discountPercent"
            class="portal-input"
            type="number"
            min="1"
            max="99"
            required
          />
        </StudioField>
      </div>
      <div class="flex flex-wrap gap-3">
        <button type="submit" class="portal-button" :disabled="busy">Save discount</button>
        <button type="button" class="portal-button-secondary" :disabled="busy" @click="cancelEdit">
          Cancel
        </button>
      </div>
    </form>

    <ul v-if="discounts.length" class="mt-4 divide-y divide-studio-rule">
      <li v-for="discount in discounts" :key="discount.id" class="py-4 last:pb-0">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <p class="text-sm tabular-nums">
            <strong>{{ discount.discountPercent }}% off</strong> from
            {{ accessMonthsLabel(discount.minimumMonths) }}
          </p>
          <div class="flex flex-wrap gap-3">
            <button
              type="button"
              class="portal-button-secondary"
              :aria-label="`Edit discount from ${accessMonthsLabel(discount.minimumMonths)}`"
              :disabled="busy || !!form || !!removing"
              @click="edit(discount)"
            >
              Edit
            </button>
            <button
              type="button"
              class="portal-button-secondary"
              :aria-label="`Remove discount from ${accessMonthsLabel(discount.minimumMonths)}`"
              :disabled="busy || !!form || !!removing"
              @click="confirmRemoval(discount)"
            >
              Remove
            </button>
          </div>
        </div>
        <div
          v-if="removing?.id === discount.id"
          class="mt-3 rounded-lg border border-studio-rule p-4"
        >
          <p class="text-sm">Remove this discount from new purchases?</p>
          <div class="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              class="portal-button"
              :disabled="busy"
              @click="update('delete', removing)"
            >
              Confirm removal
            </button>
            <button
              type="button"
              class="portal-button-secondary"
              :disabled="busy"
              @click="removing = undefined"
            >
              Cancel
            </button>
          </div>
        </div>
      </li>
    </ul>
    <p v-else class="mt-4 text-sm text-studio-muted">
      All durations are currently sold at the standard monthly rate.
    </p>
  </section>
</template>
