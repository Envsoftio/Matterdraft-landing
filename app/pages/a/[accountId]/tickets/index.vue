<script setup lang="ts">
import { parseApiError } from '~/utils/api-error'
definePageMeta({ layout: 'portal' })
usePrivatePageSeo('Support', 'Open and manage support tickets for your MatterDraft account.')
const route = useRoute()
const router = useRouter()
const accountId = computed(() => String(route.params.accountId))
const page = ref(1)
const { data, error, pending, refresh } = await useFetch<{ tickets: { id: string; subject: string; category: string; status: string; updatedAt: number }[]; hasMore: boolean }>(() => `/api/accounts/${accountId.value}/tickets`, { query: { page }, watch: [accountId, page] })
const category = ref('question'), subject = ref(''), body = ref('')
const busy = ref(false), formError = ref(''), uncertain = ref(false)
const key = ref(crypto.randomUUID())
async function create() {
  if (busy.value || uncertain.value) return
  const submittedAccountId = accountId.value, submittedPath = route.path
  busy.value = true; formError.value = ''
  try {
    const result = await $fetch<{ ticketId: string }>(`/api/accounts/${submittedAccountId}/tickets`, { method: 'POST', body: { category: category.value, subject: subject.value, body: body.value, submissionKey: key.value } })
    if (router.currentRoute.value.path === submittedPath) await navigateTo(`/a/${submittedAccountId}/tickets/${result.ticketId}`)
  } catch (cause) {
    const problem = parseApiError(cause)
    if (problem.ambiguous) uncertain.value = true
    formError.value = problem.ambiguous ? `${problem.text} Check your ticket list before sending again.` : problem.text
  } finally { busy.value = false }
}
async function checkTickets() {
  if (busy.value) return
  busy.value = true
  try {
    await refresh()
    if (error.value) { formError.value = parseApiError(error.value).text; return }
    // Keep the key and payload: the creation may have committed outside this page of results.
    uncertain.value = false
  } finally { busy.value = false }
}
</script>
<template>
  <div class="portal-content">
    <p class="portal-eyebrow">Support</p><h1 class="portal-page-title mt-2">Your tickets</h1>
    <p class="mt-3 text-sm text-studio-muted">Tickets you created for this account are visible only to you and support staff.</p>
    <div v-if="error" role="alert" class="mt-7"><p class="portal-error">{{ parseApiError(error).text }}</p><button class="portal-button-secondary mt-3" @click="refresh()">Try again</button></div>
    <div v-else class="mt-8" aria-live="polite">
      <p v-if="pending" role="status">Loading tickets…</p>
      <p v-else-if="!data?.tickets.length" class="text-sm text-studio-muted">You have no tickets for this account.</p>
      <ul v-else class="divide-y divide-studio-rule border-y border-studio-rule"><li v-for="ticket in data.tickets" :key="ticket.id" class="py-4"><NuxtLink class="portal-link font-semibold" :to="`/a/${accountId}/tickets/${ticket.id}`">{{ ticket.subject }}</NuxtLink><p class="mt-1 text-sm text-studio-muted">{{ ticket.category }} · {{ ticket.status.replaceAll('_', ' ') }} · <NuxtTime :datetime="ticket.updatedAt" date-style="short" /></p></li></ul>
      <nav v-if="data && (page > 1 || data.hasMore)" aria-label="Ticket pages" class="mt-5 flex items-center gap-3"><button class="portal-button-secondary" :disabled="page === 1 || pending" @click="page--">Previous</button><span>Page {{ page }}</span><button class="portal-button-secondary" :disabled="!data.hasMore || pending" @click="page++">Next</button></nav>
    </div>
    <form class="portal-detail mt-12 max-w-2xl" @submit.prevent="create"><h2 class="font-heading text-xl font-semibold">Contact support</h2>
      <label for="ticket-category" class="portal-label mt-5">Category</label><StudioSelect id="ticket-category" v-model="category" :disabled="busy || uncertain" class="portal-input" :options="['question', 'bug', 'billing', 'feedback']" />
      <label for="ticket-subject" class="portal-label mt-5">Subject</label><input id="ticket-subject" v-model="subject" :disabled="busy || uncertain" class="portal-input" required maxlength="120">
      <label for="ticket-body" class="portal-label mt-5">Description</label><textarea id="ticket-body" v-model="body" :disabled="busy || uncertain" class="portal-input min-h-36" required maxlength="10000" /><p class="mt-1 text-xs text-studio-muted">Up to 10,000 characters. Do not include documents or private matter content.</p>
      <p v-if="formError" role="alert" class="portal-error mt-4">{{ formError }}</p><button class="portal-button mt-5" :disabled="busy || uncertain">{{ busy ? 'Sending…' : 'Send ticket' }}</button><button v-if="uncertain" type="button" class="portal-link ml-4" @click="checkTickets">Check tickets</button>
    </form>
  </div>
</template>
