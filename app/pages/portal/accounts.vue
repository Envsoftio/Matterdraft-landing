<script setup lang="ts">
import { ChevronDown, ChevronRight } from '@lucide/vue'
import { parseApiError } from '~/utils/api-error'
definePageMeta({ layout: false, pageTransition: false })
usePrivatePageSeo(
  'Manage workspaces',
  'View and switch between your personal and organisation accounts.',
)
const {
  data,
  refresh,
  error: loadError,
  pending,
} = useDashboardFetch('/api/portal/context', { key: 'portal-context' })
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
  <NuxtLayout
    :loading="!data && !loadError"
    :pending="pending"
    name="portal"
    title="Manage workspaces"
    :description="
      data?.accounts.length
        ? 'Open your personal or organisation workspace.'
        : 'Open the invitation sent to your email to join your organisation.'
    "
  >
    <div v-if="data && !data.isStaff" class="portal-content customer-content">
      <div class="workspace-manager">
        <div v-if="data.accounts.length" class="workspace-list divide-y divide-studio-rule">
          <NuxtLink
            v-for="account in data.accounts"
            :key="account.id"
            :to="`/a/${account.id}/overview`"
            class="workspace-row"
          >
            <span class="workspace-row-label">
              <strong>
                {{ account.accountType === 'personal' ? 'Personal workspace' : account.name }}
              </strong>
              <small v-if="account.accountType === 'organisation'">
                {{ account.role.replace('_', ' ') }}
              </small>
            </span>
            <ChevronRight :size="16" aria-hidden="true" />
          </NuxtLink>
        </div>
        <details class="workspace-panel">
          <summary class="workspace-create-toggle">
            <span>Create an organisation</span>
            <ChevronDown :size="16" aria-hidden="true" />
          </summary>
          <form
            class="workspace-create-form"
            :aria-busy="busy"
            @submit.prevent="createOrganisation"
          >
            <p class="text-studio-muted">Set up a workspace for your firm and invite colleagues.</p>
            <div class="workspace-field">
              <label for="org-name" class="portal-label">Organisation name</label
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
            </div>
            <p v-if="error" class="portal-error" role="alert">{{ error }}</p>
            <div class="workspace-create-actions">
              <button class="workspace-primary" :disabled="busy || uncertain">
                {{ busy ? 'Creating…' : 'Create organisation' }}</button><button
                v-if="uncertain"
                type="button"
                class="portal-link"
                @click="checkAccounts"
              >
                Check accounts again
              </button>
            </div>
          </form>
        </details>
      </div>
    </div>
  </NuxtLayout>
</template>
