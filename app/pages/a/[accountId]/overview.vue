<script setup lang="ts">
import { parseApiError } from '~/utils/api-error'
import { licencePrice } from '~/utils/licence-price'
definePageMeta({ layout: 'portal' })
usePrivatePageSeo('Account overview', 'View your MatterDraft account details and membership.')
const route = useRoute()
const accountId = computed(() => String(route.params.accountId))
const { data, error, refresh } = await useFetch(() => `/api/accounts/${accountId.value}/overview`, {
  watch: [accountId],
})
</script>
<template>
  <div class="portal-content">
    <template v-if="data">
      <p class="portal-eyebrow">
        {{ data.account.accountType === 'organisation' ? 'Organisation' : 'Personal account' }}
      </p>
      <h1 class="portal-page-title">{{ data.account.name }}</h1>
      <div class="portal-overview-intro mt-9">
        <div>
          <p class="portal-eyebrow">Your role</p>
          <h2 class="mt-3 font-heading text-2xl font-semibold capitalize">
            {{ data.account.role.replace('_', ' ') }}
          </h2>
          <p v-if="data.memberCount !== null" class="mt-3 text-sm text-studio-muted">
            {{ data.memberCount }} {{ data.memberCount === 1 ? 'member' : 'members' }} in this
            organisation
          </p>
        </div>
      </div>
      <section v-if="data.canBill" class="portal-detail mt-5" aria-labelledby="licence-heading">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 id="licence-heading" class="font-heading text-xl font-semibold">
              {{ data.trial ? '7-day free trial' : 'Device licences' }}
            </h2>
            <p v-if="data.trial?.status === 'active'" class="mt-1 text-sm text-studio-muted">
              Full access ends
              <NuxtTime :datetime="data.trial.expiresAt" date-style="medium" time-style="short" />
            </p>
            <p v-else-if="data.trial" class="mt-1 text-sm text-studio-muted">
              {{
                data.trial.status === 'ended'
                  ? 'Your free trial has ended.'
                  : 'Try all MatterDraft Studio features for seven days.'
              }}
            </p>
          </div>
          <NuxtLink :to="`/a/${accountId}/billing`" class="portal-button-secondary">
            View plans &amp; billing
          </NuxtLink>
        </div>
        <ul
          v-if="data.plans.length"
          aria-label="Available licence plans"
          class="mt-4 flex flex-wrap gap-x-6 gap-y-3 border-t border-studio-rule pt-4"
        >
          <li v-for="plan in data.plans" :key="plan.id" class="text-sm">
            <span class="font-semibold">{{ plan.name }}</span>
            <span class="ml-2 text-studio-muted"
              >{{ licencePrice(plan.monthlyDevicePrice) }} / device / month</span
            >
          </li>
        </ul>
      </section>
      <NuxtLink
        v-if="
          data.account.accountType === 'organisation' &&
          ['owner', 'admin'].includes(data.account.role)
        "
        :to="`/a/${accountId}/members`"
        class="portal-button mt-8 inline-flex"
        >Manage members</NuxtLink
      >
    </template>
    <div v-else role="alert">
      <h1 class="portal-page-title">Account unavailable</h1>
      <p class="mt-3 text-studio-muted">
        {{
          error?.statusCode === 404
            ? 'This account is not available to you.'
            : parseApiError(error).text
        }}
      </p>
      <button class="portal-button mt-6" @click="refresh()">Try again</button>
    </div>
  </div>
</template>
