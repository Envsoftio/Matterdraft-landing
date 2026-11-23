<script setup lang="ts">
import { parseApiError } from '~/utils/api-error'

definePageMeta({ layout: 'portal' })
usePrivatePageSeo('Super Admin Dashboard', 'Oversee MatterDraft customers and service health.')

const route = useRoute()
const search = computed(() => (typeof route.query.search === 'string' ? route.query.search : ''))
const type = computed(() =>
  route.query.type === 'personal' || route.query.type === 'organisation' ? route.query.type : '',
)
const page = computed(() => Math.max(1, Math.trunc(Number(route.query.page || 1)) || 1))
const searchInput = ref(search.value)
const typeInput = ref<string>(type.value)
watch([search, type], () => {
  searchInput.value = search.value
  typeInput.value = type.value
})

const days = ref('7')
const [
  { data, error, pending, refresh },
  { data: activity, error: activityError, pending: loadingActivity, refresh: refreshActivity },
  { data: desktop, error: desktopError, refresh: refreshDesktop },
] = await Promise.all([
  useFetch('/api/internal/overview', { query: { days } }),
  useFetch('/api/internal/account-activity', { query: { search, type, page } }),
  useFetch('/api/internal/desktop-client'),
])

function filterActivity(next = 1) {
  return navigateTo({
    path: '/internal/overview',
    query: {
      search: searchInput.value.trim() || undefined,
      type: typeInput.value || undefined,
      page: next > 1 ? String(next) : undefined,
    },
    hash: '#account-activity',
  })
}

async function refreshDashboard() {
  await Promise.all([refresh(), refreshActivity(), refreshDesktop()])
}
</script>

<template>
  <div class="portal-content">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <h1 class="portal-page-title">Super Admin Dashboard</h1>
      <div class="flex flex-wrap items-center gap-4">
        <a v-if="data && !error" class="portal-link text-sm" href="#account-activity"
          >Browse accounts</a
        >
        <button
          class="portal-button-secondary"
          :disabled="pending || loadingActivity"
          @click="refreshDashboard()"
        >
          Refresh dashboard
        </button>
      </div>
    </header>

    <div v-if="error" role="alert" class="portal-error mt-8">
      {{
        error.statusCode === 403
          ? 'Your account does not have super-admin access.'
          : parseApiError(error).text
      }}
    </div>
    <template v-else-if="data">
      <section aria-labelledby="customer-metrics" class="mt-8">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="customer-metrics" class="font-heading text-xl font-semibold">
            Customer activity
          </h2>
          <div class="flex items-center gap-3 text-sm">
            <label for="activity-period">Activity period</label>
            <StudioSelect
              id="activity-period"
              v-model="days"
              class="portal-input w-auto! normal-case!"
              :options="[
                { value: '7', label: 'Last 7 days' },
                { value: '30', label: 'Last 30 days' },
              ]"
            />
          </div>
        </div>
        <dl class="portal-counts mt-0!" :aria-busy="pending">
          <div class="flex flex-col justify-between">
            <dt class="text-sm text-studio-muted">Total solo accounts</dt>
            <dd class="mt-2 font-heading text-3xl font-semibold tabular-nums">
              {{ data.counts.personal }}
            </dd>
          </div>
          <div class="flex flex-col justify-between">
            <dt class="text-sm text-studio-muted">Total law firms</dt>
            <dd class="mt-2 font-heading text-3xl font-semibold tabular-nums">
              {{ data.counts.organisations }}
            </dd>
          </div>
          <div class="flex flex-col justify-between">
            <dt class="text-sm text-studio-muted">Accounts with activity</dt>
            <dd class="mt-2 font-heading text-3xl font-semibold tabular-nums">
              {{ pending ? '…' : data.counts.activeAccounts }}
            </dd>
          </div>
          <div class="flex flex-col justify-between">
            <dt class="text-sm text-studio-muted">Tickets opened</dt>
            <dd class="mt-2 font-heading text-3xl font-semibold tabular-nums">
              {{ pending ? '…' : data.counts.newTickets }}
            </dd>
          </div>
        </dl>
      </section>

      <div class="mt-9 grid items-start gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section class="portal-detail" aria-labelledby="support-queue">
          <header class="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 id="support-queue" class="font-heading text-xl font-semibold">Needs support</h2>
              <p class="mt-1 text-sm text-studio-muted">
                {{ data.counts.needsSupport }} awaiting a response or open
              </p>
            </div>
            <NuxtLink class="portal-link text-sm" to="/internal/tickets"
              >All support tickets</NuxtLink
            >
          </header>
          <p v-if="!data.issues.length" class="mt-5 text-sm text-studio-muted">
            No tickets need a response.
          </p>
          <ul v-else class="mt-4 divide-y divide-studio-rule border-t border-studio-rule">
            <li v-for="issue in data.issues" :key="issue.id" class="py-3 last:pb-0">
              <NuxtLink
                class="portal-link break-words font-semibold"
                :to="`/internal/tickets/${issue.id}`"
              >
                {{ issue.subject }}
              </NuxtLink>
              <p class="mt-1 break-words text-sm text-studio-muted">
                {{ issue.customerName }} · {{ issue.accountName }} · {{ issue.category }} ·
                <NuxtTime :datetime="issue.updatedAt" date-style="medium" />
              </p>
            </li>
          </ul>
        </section>

        <section class="portal-detail" aria-labelledby="system-health">
          <h2 id="system-health" class="font-heading text-xl font-semibold">System health</h2>
          <dl class="mt-4 space-y-3 text-sm">
            <div class="flex items-baseline justify-between gap-3">
              <dt>Database check</dt>
              <dd class="font-semibold">Passed</dd>
            </div>
            <div class="flex items-baseline justify-between gap-3">
              <dt>Desktop sign-in registration</dt>
              <dd class="text-right font-semibold">
                <span v-if="desktopError">Check unavailable</span>
                <span v-else-if="desktop?.clientId">Registered</span>
                <span v-else-if="desktop">Unregistered</span>
                <span v-else>Checking…</span>
              </dd>
            </div>
            <div class="flex items-baseline justify-between gap-3">
              <dt>Recorded API failures · 24 hours</dt>
              <dd class="font-semibold tabular-nums">{{ data.failures.failures }}</dd>
            </div>
            <div v-if="data.failures.unavailable" class="flex items-baseline justify-between gap-3">
              <dt>Service unavailable responses</dt>
              <dd class="font-semibold tabular-nums">{{ data.failures.unavailable }}</dd>
            </div>
          </dl>
          <p
            class="mt-4 border-t border-studio-rule pt-3 text-xs leading-relaxed text-studio-muted"
          >
            Checked <NuxtTime :datetime="data.checkedAt" date-style="medium" time-style="short" />.
            Failure counts cover API responses recorded while the database is reachable.
          </p>
        </section>
      </div>

      <section id="account-activity" aria-labelledby="accounts-heading" class="mt-10 scroll-mt-24">
        <h2 id="accounts-heading" class="font-heading text-xl font-semibold">Account activity</h2>
        <p class="mt-1 text-sm text-studio-muted">
          Account creation, membership changes and customer support messages.
        </p>
        <form class="mt-4 flex flex-col gap-3 sm:flex-row" @submit.prevent="filterActivity()">
          <label class="sr-only" for="activity-search"
            >Search by account name or solo owner's email</label
          >
          <StudioField
            ><input
              id="activity-search"
              v-model="searchInput"
              class="portal-input min-w-0 sm:max-w-sm"
              type="search"
              maxlength="100"
              placeholder="Account name or solo email"
          /></StudioField>
          <label class="sr-only" for="activity-type">Account type</label>
          <StudioSelect
            id="activity-type"
            v-model="typeInput"
            class="portal-input normal-case! sm:w-auto!"
            :options="[
              { value: '', label: 'All account types' },
              { value: 'organisation', label: 'Law firms' },
              { value: 'personal', label: 'Solo advocates' },
            ]"
          />
          <button class="portal-button-secondary">Search</button>
        </form>

        <div v-if="activityError" role="alert" class="mt-4">
          <p class="portal-error">{{ parseApiError(activityError).text }}</p>
          <button class="portal-button-secondary mt-3" @click="refreshActivity()">Try again</button>
        </div>
        <p v-else-if="loadingActivity" role="status" class="mt-4 text-sm text-studio-muted">
          Loading account activity…
        </p>
        <p v-else-if="!activity?.accounts.length" class="mt-4 text-sm text-studio-muted">
          {{ search || type ? 'No accounts match this search.' : 'No customer accounts yet.' }}
        </p>
        <ul v-else class="mt-5 divide-y divide-studio-rule border-y border-studio-rule">
          <li
            v-for="account in activity.accounts"
            :key="account.id"
            class="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3.5"
          >
            <div class="min-w-0">
              <NuxtLink
                class="portal-link break-words font-semibold"
                :to="`/internal/activity/${account.id}`"
              >
                {{ account.name }}
              </NuxtLink>
              <p class="mt-0.5 text-sm text-studio-muted">
                {{ account.accountType === 'personal' ? 'Solo advocate' : 'Law firm' }}
              </p>
            </div>
            <div class="flex flex-wrap gap-x-5 gap-y-1 text-sm text-studio-muted">
              <span v-if="account.needsSupport" class="font-semibold text-studio-heading"
                >{{ account.needsSupport }} need support</span
              >
              <span
                >Last activity <NuxtTime :datetime="account.lastActivityAt" date-style="medium"
              /></span>
            </div>
          </li>
        </ul>
        <nav
          v-if="activity && (page > 1 || activity.hasMore)"
          aria-label="Account pages"
          class="mt-5 flex items-center gap-3"
        >
          <button
            class="portal-button-secondary"
            :disabled="page === 1 || loadingActivity"
            @click="filterActivity(page - 1)"
          >
            Previous
          </button>
          <span>Page {{ page }}</span>
          <button
            class="portal-button-secondary"
            :disabled="!activity.hasMore || loadingActivity"
            @click="filterActivity(page + 1)"
          >
            Next
          </button>
        </nav>
      </section>
    </template>
    <p v-else-if="pending" role="status" class="mt-8 text-sm text-studio-muted">
      Loading dashboard…
    </p>
  </div>
</template>
