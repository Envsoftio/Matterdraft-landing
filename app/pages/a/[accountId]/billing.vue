<script setup lang="ts">
import { parseApiError } from '~/utils/api-error'
import { licencePrice } from '~/utils/licence-price'

definePageMeta({ layout: 'portal', key: (route) => String(route.params.accountId) })
usePrivatePageSeo('Plans & billing', 'View your MatterDraft Studio trial and device licences.')

const route = useRoute()
const accountId = String(route.params.accountId)
const billingUrl = `/api/accounts/${accountId}/billing` as const
const { data, error, refresh, pending } = await useFetch(billingUrl)
const trial = computed(() => data.value?.trial)
const busy = ref(false)
const problem = ref('')

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
      <section v-if="trial" class="portal-detail mt-7" aria-labelledby="trial-heading">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 id="trial-heading" class="font-heading text-xl font-semibold">7-day free trial</h2>
            <p v-if="trial.status === 'active'" class="mt-2 text-sm text-studio-muted">
              Full access ends <NuxtTime :datetime="trial.expiresAt" date-style="medium" time-style="short" />
            </p>
            <p v-else-if="trial.status === 'ended'" class="mt-2 text-sm text-studio-muted">
              Trial ended <NuxtTime :datetime="trial.expiresAt" date-style="medium" time-style="short" />
            </p>
            <p v-else class="mt-2 text-sm text-studio-muted">
              Get full access for seven days from the moment you start. No payment details required.
            </p>
          </div>
          <button v-if="data.canStartTrial" type="button" class="portal-button" :disabled="busy" @click="startTrial()">Start free trial</button>
        </div>
      </section>
      <section class="mt-9" aria-labelledby="available-plans">
        <h2 id="available-plans" class="font-heading text-xl font-semibold">Available plans</h2>
        <p v-if="!data.plans.length" class="mt-3 text-sm text-studio-muted">No paid plans are available for this account yet.</p>
        <ul v-else class="mt-4 grid max-w-4xl grid-cols-1 gap-5 sm:grid-cols-2">
          <li v-for="plan in data.plans" :key="plan.id" class="portal-detail flex min-w-0 flex-col">
            <h3 class="break-words font-heading text-lg font-semibold">{{ plan.name }}</h3>
            <p class="mt-2 flex-1 break-words whitespace-pre-line text-sm text-studio-muted">{{ plan.description }}</p>
            <p class="mt-5 text-sm text-studio-muted"><strong class="font-heading text-2xl font-semibold tabular-nums text-studio-heading">{{ licencePrice(plan.monthlyDevicePrice) }}</strong> / device / month</p>
          </li>
        </ul>
        <p v-if="data.plans.length" class="mt-4 text-sm text-studio-muted">Online purchases are currently unavailable.</p>
      </section>
    </template>
  </div>
</template>
