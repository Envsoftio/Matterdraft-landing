<script setup lang="ts">
import { parseApiError } from '~/utils/api-error'
definePageMeta({ layout: 'portal' })
usePrivatePageSeo('Account overview', 'View your MatterDraft account details and membership.')
const route = useRoute()
const accountId = computed(() => String(route.params.accountId))
const { data, error, refresh } = await useFetch(() => `/api/accounts/${accountId.value}/overview`, { watch: [accountId] })
</script>
<template>
  <div class="portal-content">
    <template v-if="data">
      <p class="portal-eyebrow">{{ data.account.accountType === 'organisation' ? 'Organisation' : 'Personal account' }}</p><h1 class="portal-page-title">{{ data.account.name }}</h1>
      <div class="portal-overview-intro mt-9"><div><p class="portal-eyebrow">Your role</p><h2 class="mt-3 font-heading text-2xl font-semibold capitalize">{{ data.account.role.replace('_', ' ') }}</h2><p v-if="data.memberCount !== null" class="mt-3 text-sm text-studio-muted">{{ data.memberCount }} {{ data.memberCount === 1 ? 'member' : 'members' }} in this organisation</p></div></div>
      <NuxtLink v-if="data.account.accountType === 'organisation' && ['owner', 'admin'].includes(data.account.role)" :to="`/a/${accountId}/members`" class="portal-button mt-8 inline-flex">Manage members</NuxtLink>
    </template>
    <div v-else role="alert"><h1 class="portal-page-title">Account unavailable</h1><p class="mt-3 text-studio-muted">{{ error?.statusCode === 404 ? 'This account is not available to you.' : parseApiError(error).text }}</p><button class="portal-button mt-6" @click="refresh()">Try again</button></div>
  </div>
</template>
