<script setup lang="ts">
import { authClient } from '~~/lib/auth-client'
definePageMeta({ layout: false })
useHead({ title: 'Connect desktop app · MatterDraft Studio' })
const route = useRoute()
const { data: request, error: loadError } = await useFetch('/api/portal/oauth-request', { query: route.query })
const accessDescription = computed(() => {
  const labels: Record<string, string> = {
    openid: 'Confirm your identity',
    profile: 'Your name',
    email: 'Your email address',
    offline_access: 'Stay signed in until you disconnect',
  }
  const scopes = request.value?.scope?.split(/\s+/).filter(Boolean) || []
  return scopes.length ? scopes.map(scope => labels[scope] || scope).join(' · ') : 'Confirm your identity'
})
const busy = ref(false)
const actionError = ref('')
async function decide(accept: boolean) {
  busy.value = true
  actionError.value = ''
  const result = await authClient.oauth2.consent({ accept })
  if (result.error) actionError.value = 'We could not complete this request. Return to the desktop app and start again.'
  busy.value = false
}
</script>
<template>
  <PortalAuthShell>
    <p class="portal-eyebrow">Desktop connection</p>
    <h2 class="portal-auth-title">Review this request</h2>
    <p v-if="loadError" role="alert" class="portal-error mt-7">The connection request is unavailable or has expired. Return to the desktop app and start again.</p>
    <template v-else-if="request">
      <p class="portal-auth-intro">{{ request.clientName }} is asking to connect to your MatterDraft account.</p>
      <div class="portal-detail mt-8 space-y-4">
        <div><span>Returning to</span><strong>{{ request.redirectHost }}</strong></div>
        <div><span>Requested access</span><strong>{{ accessDescription }}</strong></div>
      </div>
      <p class="mt-6 text-sm leading-6 text-studio-muted">Continue only if you started this request in the MatterDraft desktop app.</p>
      <p v-if="actionError" role="alert" class="portal-error mt-5">{{ actionError }}</p>
      <div class="mt-8 flex gap-3"><button class="portal-button flex-1" :disabled="busy" @click="decide(true)">Connect app</button><button class="portal-button-secondary flex-1" :disabled="busy" @click="decide(false)">Deny</button></div>
    </template>
  </PortalAuthShell>
</template>
