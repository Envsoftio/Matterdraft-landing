<script setup lang="ts">
import { parseApiError } from '~/utils/api-error'
import { supportCategoryLabel, supportStatusLabel } from '~/utils/support-labels'
definePageMeta({ layout: 'portal' })
usePrivatePageSeo('Support', 'Open and manage support tickets for your MatterDraft account.')
const route = useRoute()
const router = useRouter()
const accountId = computed(() => String(route.params.accountId))
const page = ref(1)
const { data, error, pending, refresh } = await useFetch<{
  tickets: { id: string; subject: string; category: string; status: string; updatedAt: number }[]
  hasMore: boolean
}>(() => `/api/accounts/${accountId.value}/tickets`, { query: { page }, watch: [accountId, page] })
const category = ref('question'),
  subject = ref(''),
  body = ref('')
const busy = ref(false),
  formError = ref(''),
  uncertain = ref(false)
const key = ref(crypto.randomUUID())
async function create() {
  if (busy.value || uncertain.value) return
  const submittedAccountId = accountId.value,
    submittedPath = route.path
  busy.value = true
  formError.value = ''
  try {
    const result = await $fetch<{ ticketId: string }>(
      `/api/accounts/${submittedAccountId}/tickets`,
      {
        method: 'POST',
        body: {
          category: category.value,
          subject: subject.value,
          body: body.value,
          submissionKey: key.value,
        },
      },
    )
    if (router.currentRoute.value.path === submittedPath)
      await navigateTo(`/a/${submittedAccountId}/tickets/${result.ticketId}`)
  } catch (cause) {
    const problem = parseApiError(cause)
    if (problem.ambiguous) uncertain.value = true
    formError.value = problem.ambiguous
      ? `${problem.text} Check your ticket list before sending again.`
      : problem.text
  } finally {
    busy.value = false
  }
}
async function checkTickets() {
  if (busy.value) return
  busy.value = true
  try {
    await refresh()
    if (error.value) {
      formError.value = parseApiError(error.value).text
      return
    }
    // Keep the key and payload: the creation may have committed outside this page of results.
    uncertain.value = false
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <div class="portal-content customer-content customer-page">
    <header class="customer-page-heading customer-page-heading-action">
      <div>
        <h1 class="heading-4">Support</h1>
        <p class="body-3">Tickets are visible only to you and support staff.</p>
      </div>
      <a href="#contact-support-heading" class="portal-button-secondary button-sm"
        >Contact support</a
      >
    </header>
    <div class="support-layout">
      <section class="support-inbox" aria-labelledby="tickets-heading">
        <h2 id="tickets-heading" class="title-3">Your tickets</h2>
        <div v-if="error" role="alert" class="customer-section">
          <p class="portal-error">{{ parseApiError(error).text }}</p>
          <button class="portal-button-secondary button-sm customer-retry" @click="refresh()">
            Try again
          </button>
        </div>
        <div v-else class="support-ticket-list" aria-live="polite">
          <div v-if="pending" class="customer-loading-panel" role="status" aria-busy="true">
            <span class="sr-only">Loading tickets</span>
          </div>
          <div v-else-if="!data?.tickets.length" class="customer-empty">
            <h3 class="title-3">No tickets yet</h3>
            <p class="body-6">
              Send a request using the contact form. Your conversations will appear here.
            </p>
          </div>
          <ul v-else class="support-tickets">
            <li v-for="ticket in data.tickets" :key="ticket.id" class="support-ticket">
              <div class="support-ticket-subject">
                <NuxtLink class="title-4" :to="`/a/${accountId}/tickets/${ticket.id}`">{{
                  ticket.subject
                }}</NuxtLink>
                <span class="body-6">{{ supportCategoryLabel(ticket.category) }}</span>
              </div>
              <div class="support-ticket-meta">
                <span class="customer-status caption-3" :class="`ticket-${ticket.status}`">{{
                  supportStatusLabel(ticket.status)
                }}</span>
                <span class="caption-5"
                  >Updated
                  <NuxtTime :datetime="ticket.updatedAt" month="short" day="numeric" year="numeric"
                /></span>
              </div>
            </li>
          </ul>
          <nav
            v-if="data && (page > 1 || data.hasMore)"
            aria-label="Ticket pages"
            class="support-pagination body-6"
          >
            <button
              class="portal-button-secondary button-sm"
              :disabled="page === 1 || pending"
              @click="page--"
            >
              Previous
            </button>
            <span>Page {{ page }}</span>
            <button
              class="portal-button-secondary button-sm"
              :disabled="!data.hasMore || pending"
              @click="page++"
            >
              Next
            </button>
          </nav>
        </div>
      </section>
      <form
        class="support-compose customer-panel"
        aria-labelledby="contact-support-heading"
        @submit.prevent="create"
      >
        <header class="customer-panel-heading">
          <h2 id="contact-support-heading" class="title-3" tabindex="-1">Contact support</h2>
        </header>
        <div class="customer-panel-body">
          <div class="customer-field">
            <label for="ticket-category" class="title-4">Category</label>
            <StudioSelect
              id="ticket-category"
              v-model="category"
              :disabled="busy || uncertain"
              class="portal-input"
              :options="['question', 'bug', 'billing', 'feedback']"
            />
          </div>
          <div class="customer-field">
            <label for="ticket-subject" class="title-4">Subject</label>
            <StudioField
              ><input
                id="ticket-subject"
                v-model="subject"
                :disabled="busy || uncertain"
                class="portal-input"
                required
                maxlength="120"
            /></StudioField>
          </div>
          <div class="customer-field">
            <label for="ticket-body" class="title-4">Description</label>
            <StudioField>
              <textarea
                id="ticket-body"
                v-model="body"
                :disabled="busy || uncertain"
                class="portal-input"
                aria-describedby="ticket-privacy"
                required
                maxlength="10000"
              />
            </StudioField>
            <p id="ticket-privacy" class="customer-muted caption-5">
              Up to 10,000 characters. Do not include documents or private matter content.
            </p>
          </div>
          <p v-if="formError" role="alert" class="portal-error">{{ formError }}</p>
          <div class="customer-form-actions">
            <button
              class="workspace-primary button-sm"
              :disabled="busy || uncertain"
              :aria-busy="busy"
            >
              {{ busy ? 'Sending…' : 'Send ticket' }}
            </button>
            <button v-if="uncertain" type="button" class="portal-link body-6" @click="checkTickets">
              Check tickets
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>
