<script setup lang="ts">
import { ChevronRight } from '@lucide/vue'
import { parseApiError } from '~/utils/api-error'
definePageMeta({ layout: 'portal' })
usePrivatePageSeo(
  'Manage workspaces',
  'View and switch between your personal and organisation accounts.',
)
const {
  data,
  refresh,
  error: loadError,
} = await useFetch('/api/portal/context', { key: 'portal-context' })
if (data.value?.isStaff) await navigateTo('/internal/overview', { replace: true })
const name = ref('')
const busy = ref(false)
const error = ref('')
const uncertain = ref(false)
async function checkAccounts() {
  await refresh()
  if (!loadError.value) {
    uncertain.value = false
    error.value = ''
  }
}
async function createOrganisation() {
  name.value = name.value.trim()
  if (name.value.length < 2) {
    error.value = 'Enter an organisation name with at least two characters.'
    return
  }
  busy.value = true
  error.value = ''
  uncertain.value = false
  const existingIds = new Set(data.value?.accounts.map((account) => account.id) || [])
  try {
    const result = await $fetch<{ accountId: string }>('/api/membership/organisations', {
      method: 'POST',
      body: { name: name.value },
    })
    await refresh()
    await navigateTo(`/a/${result.accountId}/members`)
  } catch (cause) {
    const problem = parseApiError(cause)
    if (problem.ambiguous) {
      try {
        await refresh()
      } catch {
        /* Keep the action blocked until state is known. */
      }
      const matching =
        data.value?.accounts.filter(
          (account) =>
            account.accountType === 'organisation' &&
            account.name === name.value &&
            !existingIds.has(account.id),
        ) || []
      if (matching.length === 1) {
        await navigateTo(`/a/${matching[0]!.id}/members`)
        return
      }
      uncertain.value = true
      error.value = `${problem.text} Check your accounts before creating another organisation.`
    } else error.value = problem.text
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <div v-if="data && !data.isStaff" class="portal-content customer-content">
    <h1 class="portal-page-title">Manage workspaces</h1>
    <p v-if="data.accounts.length" class="mt-3 text-studio-muted">
      Open your personal or organisation workspace.
    </p>
    <p v-else class="mt-3 text-studio-muted">
      Open the invitation sent to your email to join your organisation.
    </p>
    <div v-if="data.accounts.length" class="workspace-list mt-8 divide-y divide-studio-rule">
      <NuxtLink
        v-for="account in data.accounts"
        :key="account.id"
        :to="`/a/${account.id}/overview`"
        class="workspace-row"
      >
        <span class="min-w-0 break-words">
          <strong class="block font-semibold">
            {{ account.accountType === 'personal' ? 'Personal workspace' : account.name }}
          </strong>
          <small v-if="account.accountType === 'organisation'" class="text-studio-muted">
            {{ account.role.replace('_', ' ') }}
          </small>
        </span>
        <ChevronRight :size="18" aria-hidden="true" />
      </NuxtLink>
    </div>
    <details class="workspace-panel mt-8 max-w-xl">
      <summary class="cursor-pointer font-semibold">Create an organisation</summary>
      <form :aria-busy="busy" @submit.prevent="createOrganisation">
        <p class="mt-3 text-sm text-studio-muted">
          Set up a workspace for your firm and invite colleagues.
        </p>
        <label for="org-name" class="portal-label mt-6">Organisation name</label
        ><StudioField
          ><input
            id="org-name"
            v-model="name"
            class="portal-input"
            maxlength="100"
            minlength="2"
            required
            :readonly="busy || uncertain"
            autocomplete="organization"
        /></StudioField>
        <p v-if="error" class="portal-error mt-4" role="alert">{{ error }}</p>
        <button class="portal-button mt-5" :disabled="busy || uncertain">
          {{ busy ? 'Creating…' : 'Create organisation' }}</button><button
          v-if="uncertain"
          type="button"
          class="portal-link mt-4 block"
          @click="checkAccounts"
        >
          Check accounts again
        </button>
      </form>
    </details>
  </div>
</template>
