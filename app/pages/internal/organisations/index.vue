<script setup lang="ts">
import { parseApiError } from '~/utils/api-error'

definePageMeta({ layout: false, pageTransition: false })
usePrivatePageSeo('Organisations', 'Find organisations in the staff workspace.')

type Organisation = { id: string; name: string; createdAt: number; memberCount: number }
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
const { data, error, pending, refresh } = useLazyFetch<{
  organisations: Organisation[]
  page: number
  hasMore: boolean
}>('/api/internal/organisations', {
  query: { search, page },
  watch: [search, page],
})
function submitSearch() {
  navigateTo({
    path: '/internal/organisations',
    query: searchInput.value.trim() ? { search: searchInput.value.trim() } : {},
  })
}
function goToPage(nextPage: number) {
  navigateTo({
    path: '/internal/organisations',
    query: { ...(search.value ? { search: search.value } : {}), page: String(nextPage) },
  })
}
</script>

<template>
  <NuxtLayout
    :loading="!data && !error"
    :pending="pending"
    name="portal"
    title="Organisations"
    description="Find an organisation and review its members and invitations."
  >
    <div class="portal-content">
      <form class="flex max-w-xl flex-col gap-3 sm:flex-row" @submit.prevent="submitSearch">
        <label class="sr-only" for="organisation-search">Search organisations by name</label>
        <StudioField
          ><input
            id="organisation-search"
            v-model="searchInput"
            class="portal-input flex-1"
            type="search"
            maxlength="100"
            placeholder="Search organisation name"
            autocomplete="off"
        /></StudioField>
        <button class="portal-button" type="submit">Search</button>
      </form>
      <div v-if="error" role="alert" class="mt-8">
        <p class="portal-error">{{ parseApiError(error).text }}</p>
        <button class="portal-button-secondary mt-3" @click="refresh()">Try again</button>
      </div>
      <div v-else class="mt-8">
        <p v-if="pending" role="status" class="text-sm text-studio-muted">Loading organisations…</p>
        <div v-else-if="data" class="overflow-x-auto border-y border-studio-rule">
          <table class="w-full text-left text-sm">
            <thead class="bg-studio-tint">
              <tr>
                <th scope="col" class="p-3">Organisation</th>
                <th scope="col" class="p-3">Members</th>
                <th scope="col" class="p-3">Created</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in data.organisations"
                :key="item.id"
                class="border-t border-studio-rule"
              >
                <td class="p-3 font-semibold">
                  <NuxtLink class="portal-link" :to="`/internal/organisations/${item.id}`">{{
                    item.name
                  }}</NuxtLink>
                </td>
                <td class="p-3 tabular-nums">{{ item.memberCount }}</td>
                <td class="p-3"><NuxtTime :datetime="item.createdAt" date-style="short" /></td>
              </tr>
            </tbody>
          </table>
          <p v-if="!data.organisations.length" class="p-5 text-sm text-studio-muted">
            {{ search ? 'No organisations match this search.' : 'No organisations yet.' }}
          </p>
        </div>
        <nav
          v-if="data && (page > 1 || data.hasMore)"
          aria-label="Organisation pages"
          class="mt-5 flex items-center gap-4 text-sm"
        >
          <button
            class="portal-button-secondary"
            :disabled="page <= 1 || pending"
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
