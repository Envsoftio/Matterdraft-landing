<script setup lang="ts">
import { parseApiError } from '~/utils/api-error'
definePageMeta({ layout: 'portal' })
usePrivatePageSeo('Administration', 'View the MatterDraft staff administration overview.')
const { data, error, refresh } = await useFetch('/api/internal/overview')
const { data: desktop, refresh: refreshDesktop } = await useFetch('/api/internal/desktop-client')
const countLabels: Record<string, string> = { users: 'Registered users', accounts: 'Customer accounts', organisations: 'Organisations', staff: 'Staff members' }
const registering = ref(false)
const registerError = ref('')
async function registerDesktop() {
  registering.value = true
  registerError.value = ''
  try {
    await $fetch('/api/internal/desktop-client', { method: 'POST' })
    await refreshDesktop()
  } catch { registerError.value = 'Could not register the desktop app. Sign in again and retry.' }
  finally { registering.value = false }
}
</script>
<template>
  <div class="portal-content">
    <template v-if="data">
      <p class="portal-eyebrow">Internal administration</p><h1 class="portal-page-title">Customer administration</h1>
      <div class="portal-counts"><div v-for="(value, label) in data.counts" :key="label"><p class="text-sm text-studio-muted">{{ countLabels[String(label)] || label }}</p><p class="mt-2 font-heading text-3xl font-semibold tabular-nums">{{ value }}</p></div></div>
      <div class="mt-11 grid gap-10 lg:grid-cols-[1.3fr_1fr]"><section class="portal-detail"><h2 class="font-heading text-lg font-semibold">Staff access</h2><p class="mt-3 text-sm leading-6 text-studio-muted">Staff sign in with their own verified account. Customer matters are not shown here.</p></section><aside v-if="desktop" class="portal-detail"><h2 class="font-heading text-lg font-semibold">Desktop app connection</h2><p class="mt-2 text-sm text-studio-muted">Register the desktop app to let customers sign in from it.</p><dl class="mt-5 space-y-3 break-all text-xs"><div><dt class="text-studio-muted">Return address</dt><dd class="mt-1 font-medium">{{ desktop.redirectUri }}</dd></div><div v-if="desktop.clientId"><dt class="text-studio-muted">Client ID</dt><dd class="mt-1 font-medium">{{ desktop.clientId }}</dd></div></dl><button v-if="!desktop.clientId" class="portal-button mt-5" :disabled="registering" @click="registerDesktop">{{ registering ? 'Registering…' : 'Register desktop app' }}</button><p v-if="registerError" role="alert" class="portal-error mt-4">{{ registerError }}</p></aside></div>
    </template>
    <div v-else role="alert"><h1 class="portal-page-title">Administration unavailable</h1><p class="mt-3 text-studio-muted">{{ error?.statusCode === 403 ? 'Your account does not have staff access.' : parseApiError(error).text }}</p><button class="portal-button mt-6" @click="refresh()">Try again</button></div>
  </div>
</template>
