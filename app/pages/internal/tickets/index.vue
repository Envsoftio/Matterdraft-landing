<script setup lang="ts">
import { parseApiError } from '~/utils/api-error'
definePageMeta({ layout: false, pageTransition: false })
usePrivatePageSeo('Support tickets', 'Review the MatterDraft support queue.')
const route = useRoute()
const searchInput = ref(typeof route.query.search === 'string' ? route.query.search : '')
const search = computed(() => (typeof route.query.search === 'string' ? route.query.search : ''))
const page = computed(() => Math.max(1, Number(route.query.page || 1) || 1))
const { data, error, pending, refresh } = useLazyFetch<{
  tickets: {
    id: string
    subject: string
    status: string
    accountName: string
    creatorEmail: string
    updatedAt: number
  }[]
  hasMore: boolean
}>('/api/internal/tickets', { query: { search, page }, watch: [search, page] })
function submitSearch() {
  navigateTo({
    path: '/internal/tickets',
    query: searchInput.value.trim() ? { search: searchInput.value.trim() } : {},
  })
}
function goToPage(next: number) {
  navigateTo({
    path: '/internal/tickets',
    query: { ...(search.value ? { search: search.value } : {}), page: String(next) },
  })
}
</script>
<template>
  <NuxtLayout :loading="!data && !error" :pending="pending" name="portal" title="Support tickets">
    <div class="portal-content">
      <form class="flex max-w-xl flex-col gap-3 sm:flex-row" @submit.prevent="submitSearch">
        <label class="sr-only" for="ticket-search">Search tickets</label
        ><StudioField
          ><input
            id="ticket-search"
            v-model="searchInput"
            class="portal-input flex-1"
            type="search"
            maxlength="100"
            placeholder="Subject, account or customer email" /></StudioField
        ><button class="portal-button">Search</button>
      </form>
      <div v-if="error" role="alert" class="mt-8">
        <p class="portal-error">{{ parseApiError(error).text }}</p>
        <button class="portal-button-secondary mt-3" @click="refresh()">Try again</button>
      </div>
      <div v-else class="mt-8" aria-live="polite">
        <p v-if="pending" role="status">Loading tickets…</p>
        <p v-else-if="!data?.tickets.length" class="text-sm text-studio-muted">
          {{ search ? 'No tickets match this search.' : 'No tickets yet.' }}
        </p>
        <ul v-else class="divide-y divide-studio-rule border-y border-studio-rule">
          <li v-for="ticket in data.tickets" :key="ticket.id" class="py-4">
            <NuxtLink class="portal-link font-semibold" :to="`/internal/tickets/${ticket.id}`">{{
              ticket.subject
            }}</NuxtLink>
            <p class="mt-1 text-sm text-studio-muted">
              {{ ticket.accountName }} · {{ ticket.creatorEmail }} ·
              {{ ticket.status.replaceAll('_', ' ') }} ·
              <NuxtTime :datetime="ticket.updatedAt" date-style="short" />
            </p>
          </li>
        </ul>
        <nav
          v-if="data && (page > 1 || data.hasMore)"
          aria-label="Ticket pages"
          class="mt-5 flex items-center gap-3"
        >
          <button
            class="portal-button-secondary"
            :disabled="page === 1 || pending"
            @click="goToPage(page - 1)"
          >
            Previous</button
          ><span>Page {{ page }}</span
          ><button
            class="portal-button-secondary"
            :disabled="!data.hasMore || pending"
            @click="goToPage(page + 1)"
          >
            Next
          </button>
        </nav>
      </div>
    </div>
  </NuxtLayout>
</template>
