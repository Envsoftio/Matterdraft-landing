<script setup lang="ts">
import { parseApiError } from '~/utils/api-error'

definePageMeta({ layout: false, pageTransition: false })
usePrivatePageSeo('Account activity', 'Review a MatterDraft customer account’s activity.')

const route = useRoute()
const accountId = computed(() => String(route.params.accountId))
const page = computed(() => Math.max(1, Math.trunc(Number(route.query.page || 1)) || 1))
const { data, error, pending, refresh } = useDashboardFetch(
  () => `/api/internal/account-activity/${accountId.value}`,
  { query: { page } },
)
const descriptions: Record<string, string> = {
  'account.created': 'Account created',
  'invitation.created': 'Invitation sent',
  'invitation.revoked': 'Invitation revoked',
  'invitation.reissued': 'Invitation reissued',
  'invitation.accepted': 'Invitation accepted',
  'membership.role_changed': 'Member role changed',
  'membership.removed': 'Member removed',
  'ownership.transfer_requested': 'Ownership transfer requested',
  'ownership.transferred': 'Ownership transferred',
  'support.customer_message': 'Customer sent a support message',
}
function goToPage(next: number) {
  return navigateTo({ path: route.path, query: next === 1 ? {} : { page: String(next) } })
}
</script>

<template>
  <NuxtLayout
    :loading="!data && !error"
    :pending="pending"
    name="portal"
    :title="error ? 'Account activity unavailable' : data?.account.name || 'Account activity'"
  >
    <template v-if="data && !error" #description>
      {{ data.account.accountType === 'personal' ? 'Solo advocate' : 'Law firm' }}
      <template v-if="data.account.accountType === 'organisation'">
        · {{ data.account.members }} {{ data.account.members === 1 ? 'member' : 'members' }}
      </template>
    </template>
    <div class="portal-content">
      <NuxtLink class="portal-link text-sm" to="/internal/overview#account-activity"
        >Back to account activity</NuxtLink
      >
      <div v-if="error" role="alert" class="mt-6">
        <p class="portal-error mt-4">{{ parseApiError(error).text }}</p>
        <button class="portal-button-secondary mt-3" @click="refresh()">Try again</button>
      </div>
      <template v-else-if="data">
        <header class="mt-6">
          <NuxtLink
            v-if="data.account.ownerId"
            class="portal-link mt-3 inline-block text-sm"
            :to="`/internal/customers/${data.account.ownerId}`"
          >
            View customer profile
          </NuxtLink>
          <NuxtLink
            v-else
            class="portal-link mt-3 inline-block text-sm"
            :to="`/internal/organisations/${data.account.id}`"
          >
            View firm and members
          </NuxtLink>
        </header>
        <section class="mt-8" aria-labelledby="activity-heading">
          <h2 id="activity-heading" class="font-heading text-xl font-semibold">
            Activity timeline
          </h2>
          <p v-if="!data.events.length" class="mt-4 text-sm text-studio-muted">
            No activity on this page.
          </p>
          <ol v-else class="mt-4 divide-y divide-studio-rule border-y border-studio-rule">
            <li
              v-for="event in data.events"
              :key="`${event.event}-${event.id}`"
              class="flex flex-wrap justify-between gap-3 py-4"
            >
              <div class="min-w-0">
                <p class="font-semibold">{{ descriptions[event.event] }}</p>
                <p v-if="event.person" class="mt-1 break-words text-sm text-studio-muted">
                  {{ event.person }}
                </p>
                <NuxtLink
                  v-if="event.ticketId"
                  class="portal-link mt-1 inline-block text-sm"
                  :to="`/internal/tickets/${event.ticketId}`"
                >
                  Open support ticket
                </NuxtLink>
              </div>
              <NuxtTime
                class="text-sm text-studio-muted"
                :datetime="event.createdAt"
                date-style="medium"
                time-style="short"
              />
            </li>
          </ol>
          <nav
            v-if="page > 1 || data.hasMore"
            aria-label="Activity pages"
            class="mt-5 flex items-center gap-3"
          >
            <button
              class="portal-button-secondary"
              :disabled="page === 1 || pending"
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
        </section>
      </template>
      <p v-else-if="pending" role="status" class="mt-8 text-sm text-studio-muted">
        Loading activity…
      </p>
    </div>
  </NuxtLayout>
</template>
