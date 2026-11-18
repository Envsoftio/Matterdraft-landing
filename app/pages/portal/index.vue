<script setup lang="ts">
import { parseApiError } from '~/utils/api-error'
definePageMeta({ layout: 'portal' })
usePrivatePageSeo('Accounts', 'View and switch between your personal and organisation accounts.')
type Context = { accounts: { id: string; name: string; accountType: string; role: string }[] }
const { data, refresh, error: loadError } = await useFetch<Context>('/api/portal/context', { key: 'portal-context' })
const name = ref('')
const busy = ref(false)
const error = ref('')
const uncertain = ref(false)
async function checkAccounts() { await refresh(); if (!loadError.value) uncertain.value = false }
async function createOrganisation() {
  busy.value = true; error.value = ''; uncertain.value = false
  const existingIds = new Set(data.value?.accounts.map(account => account.id) || [])
  try {
    const result = await $fetch<{ accountId: string }>('/api/membership/organisations', { method: 'POST', body: { name: name.value } })
    await refresh()
    await navigateTo(`/a/${result.accountId}/members`)
  } catch (cause) {
    const problem = parseApiError(cause)
    if (problem.ambiguous) {
      try { await refresh() } catch { /* Keep the action blocked until state is known. */ }
      const matching = data.value?.accounts.filter(account => account.accountType === 'organisation' && account.name === name.value && !existingIds.has(account.id)) || []
      if (matching.length === 1) { await navigateTo(`/a/${matching[0]!.id}/members`); return }
      uncertain.value = true
      error.value = `${problem.text} Check your accounts before creating another organisation.`
    } else error.value = problem.text
  }
  finally { busy.value = false }
}
</script>
<template>
  <div class="portal-content">
    <p class="portal-eyebrow">Accounts</p><h1 class="portal-page-title mt-2">Your accounts</h1>
    <p class="mt-3 text-studio-muted">Choose an account to manage.</p>
    <div class="mt-9 divide-y divide-studio-rule border-y border-studio-rule">
      <NuxtLink v-for="account in data?.accounts" :key="account.id" :to="`/a/${account.id}/overview`" class="flex items-center justify-between gap-4 py-5 hover:text-studio-accent"><span><strong class="block font-heading text-lg">{{ account.name }}</strong><small class="text-studio-muted">{{ account.accountType === 'personal' ? 'Personal account' : 'Organisation' }} · {{ account.role.replace('_', ' ') }}</small></span><span aria-hidden="true">↗</span></NuxtLink>
    </div>
    <form class="portal-detail mt-11 max-w-xl" @submit.prevent="createOrganisation"><h2 class="font-heading text-xl font-semibold">Create an organisation</h2><p class="mt-2 text-sm text-studio-muted">Add colleagues and manage their roles.</p><label for="org-name" class="portal-label mt-6">Organisation name</label><input id="org-name" v-model="name" class="portal-input" maxlength="100" minlength="2" required autocomplete="organization"><p v-if="error" class="portal-error mt-4" role="alert">{{ error }}</p><button class="portal-button mt-5" :disabled="busy || uncertain">{{ busy ? 'Creating…' : 'Create organisation' }}</button><button v-if="uncertain" type="button" class="portal-link mt-4 block" @click="checkAccounts">Check accounts again</button></form>
  </div>
</template>
