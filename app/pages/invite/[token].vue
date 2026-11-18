<script setup lang="ts">
import { parseApiError } from '~/utils/api-error'
definePageMeta({ layout: 'portal' })
const route = useRoute(); const token = String(route.params.token)
const { data, error, refresh } = await useFetch<{ accountName: string; accountId: string; inviteeEmail: string; invitedRole: string; invitationType: string; invitationStatus: string; expiresAt: number }>(`/api/membership/invitations/${token}`)
const busy = ref(false); const issue = ref(''); const accepted = ref(false); const uncertain = ref(false)
async function checkInvitation() {
  await refresh()
  if (!error.value) { uncertain.value = false; await refreshNuxtData('portal-context') }
}
async function accept() {
  busy.value = true; issue.value = ''; uncertain.value = false
  try {
    await $fetch(`/api/membership/invitations/${token}`, { method: 'POST' })
    accepted.value = true
    await refreshNuxtData('portal-context'); await refresh()
  } catch (cause) {
    const problem = parseApiError(cause)
    if (problem.ambiguous) {
      try { await refresh(); await refreshNuxtData('portal-context') } catch { /* Status remains uncertain. */ }
      if (data.value?.invitationStatus === 'accepted') accepted.value = true
      else { uncertain.value = true; issue.value = `${problem.text} Check this invitation's status before accepting again.` }
    } else issue.value = problem.text
  } finally { busy.value = false }
}
</script>
<template><div class="portal-content max-w-2xl"><p class="portal-eyebrow">Organisation invitation</p><h1 class="portal-page-title mt-2">{{ data?.invitationType === 'transfer' ? 'Accept ownership' : 'Join an organisation' }}</h1><template v-if="data"><div class="portal-detail mt-8"><h2 class="font-heading text-xl font-semibold">{{ data.accountName }}</h2><p class="mt-3 text-sm text-studio-muted">Sent to {{ data.inviteeEmail }} · {{ data.invitedRole.replace('_', ' ') }} role</p><p class="mt-2 text-sm text-studio-muted">Expires <NuxtTime :datetime="data.expiresAt" date-style="short" time-style="medium" /></p><p v-if="data.invitationType === 'transfer'" class="mt-5 text-sm">You become owner when you accept. The current owner becomes an admin.</p><p v-if="issue" class="portal-error mt-5" role="alert">{{ issue }}</p><p v-if="accepted || data.invitationStatus === 'accepted'" class="portal-notice mt-5">{{ data.invitationType === 'transfer' ? 'You now own this organisation.' : 'You joined this organisation.' }}</p><p v-else-if="data.invitationStatus !== 'pending'" class="portal-error mt-5">This invitation is {{ data.invitationStatus }}. Ask an organisation administrator for a new one.</p><button v-else class="portal-button mt-6" :disabled="busy || uncertain" @click="accept">{{ busy ? 'Confirming…' : 'Accept invitation' }}</button><button v-if="uncertain" class="portal-link mt-4 block" @click="checkInvitation">Check invitation status</button></div><div class="mt-6 flex gap-6"><NuxtLink v-if="accepted || data.invitationStatus === 'accepted'" :to="`/a/${data.accountId}/overview`" class="portal-link">Open organisation</NuxtLink><NuxtLink to="/portal" class="portal-link">Your accounts</NuxtLink></div></template><div v-else class="portal-error mt-8">{{ parseApiError(error).text }} <button v-if="error?.statusCode !== 401" class="portal-link" @click="checkInvitation">Check invitation status</button> <NuxtLink v-else :to="`/sign-in?returnTo=${encodeURIComponent(route.fullPath)}`" class="portal-link">Sign in</NuxtLink></div></div></template>
