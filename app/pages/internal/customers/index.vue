<script setup lang="ts">
import { parseApiError } from '~/utils/api-error'

definePageMeta({ layout: 'portal' })
usePrivatePageSeo('Customers', 'Find customer accounts in the staff workspace.')

type Customer = {
  id: string
  name: string
  email: string
  emailVerified: boolean
  createdAt: number
  accountCount: number
}
const route = useRoute()
const searchInput = ref(typeof route.query.search === 'string' ? route.query.search : '')
const search = computed(() => (typeof route.query.search === 'string' ? route.query.search : ''))
watch(search, (value) => {
  searchInput.value = value
})
const page = computed(() => {
  const value = Number(route.query.page || 1)
  return Number.isSafeInteger(value) && value > 0 ? value : 1
})
const { data, error, pending, refresh } = await useFetch<{
  customers: Customer[]
  page: number
  hasMore: boolean
}>('/api/internal/customers', {
  query: { search, page },
  watch: [search, page],
})

function submitSearch() {
  navigateTo({
    path: '/internal/customers',
    query: searchInput.value.trim() ? { search: searchInput.value.trim() } : {},
  })
}
function goToPage(nextPage: number) {
  navigateTo({
    path: '/internal/customers',
    query: { ...(search.value ? { search: search.value } : {}), page: String(nextPage) },
  })
}
</script>

<template>
  <div class="portal-content">
    <p class="portal-eyebrow">Internal administration</p>
    <h1 class="portal-page-title mt-2">Customers</h1>
    <p class="mt-3 text-sm text-studio-muted">
      Find a customer and review their account memberships.
    </p>

    <form class="mt-8 flex max-w-xl flex-col gap-3 sm:flex-row" @submit.prevent="submitSearch">
      <label class="sr-only" for="customer-search">Search by name or email</label>
      <StudioField
        ><input
          id="customer-search"
          v-model="searchInput"
          class="portal-input flex-1"
          type="search"
          maxlength="100"
          placeholder="Search name or email"
          autocomplete="off"
      /></StudioField>
      <button class="portal-button" type="submit">Search</button>
    </form>

    <div v-if="error" role="alert" class="mt-8">
      <p class="portal-error">{{ parseApiError(error).text }}</p>
      <button class="portal-button-secondary mt-3" @click="refresh()">Try again</button>
    </div>
    <div v-else class="mt-8">
      <p v-if="pending" role="status" class="text-sm text-studio-muted">Loading customers…</p>
      <div v-else-if="data" class="overflow-x-auto border-y border-studio-rule">
        <table class="w-full text-left text-sm">
          <thead class="bg-studio-tint">
            <tr>
              <th scope="col" class="p-3">Customer</th>
              <th scope="col" class="p-3">Email</th>
              <th scope="col" class="p-3">Accounts</th>
              <th scope="col" class="p-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="customer in data.customers"
              :key="customer.id"
              class="border-t border-studio-rule"
            >
              <td class="p-3 font-semibold">
                <NuxtLink class="portal-link" :to="`/internal/customers/${customer.id}`">{{
                  customer.name
                }}</NuxtLink>
              </td>
              <td class="p-3">
                {{ customer.email
                }}<span v-if="!customer.emailVerified" class="ml-2 text-xs text-studio-muted"
                  >Unverified</span
                >
              </td>
              <td class="p-3 tabular-nums">{{ customer.accountCount }}</td>
              <td class="p-3"><NuxtTime :datetime="customer.createdAt" date-style="short" /></td>
            </tr>
          </tbody>
        </table>
        <p v-if="!data.customers.length" class="p-5 text-sm text-studio-muted">
          {{ search ? 'No customers match this search.' : 'No customers yet.' }}
        </p>
      </div>
      <nav
        v-if="data && (page > 1 || data.hasMore)"
        aria-label="Customer pages"
        class="mt-5 flex items-center gap-4 text-sm"
      >
        <button
          class="portal-button-secondary"
          :disabled="page <= 1 || pending"
          @click="goToPage(page - 1)"
        >
          Previous
        </button>
        <span>Page {{ page }}</span>
        <button
          class="portal-button-secondary"
          :disabled="!data.hasMore || pending"
          @click="goToPage(page + 1)"
        >
          Next
        </button>
      </nav>
    </div>
  </div>
</template>
