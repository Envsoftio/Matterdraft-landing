<script setup lang="ts">
import { parseApiError } from '~/utils/api-error'

definePageMeta({ layout: false, pageTransition: false })
usePrivatePageSeo(
  'Customer details',
  'Review customer account and membership details in the staff workspace.',
)

type Detail = {
  customer: { id: string; name: string; email: string; emailVerified: boolean; createdAt: number }
  memberships: {
    accountId: string
    accountName: string
    accountType: string
    role: string
    joinedAt: number
  }[]
}
const route = useRoute()
const userId = computed(() => String(route.params.userId))
const { data, error, refresh, pending } = useDashboardFetch<Detail>(
  () => `/api/internal/customers/${encodeURIComponent(userId.value)}`,
  { watch: [userId] },
)
</script>

<template>
  <NuxtLayout
    :loading="!data && !error"
    :pending="pending"
    name="portal"
    :title="data?.customer.name || (error ? 'Customer unavailable' : 'Customer')"
    :description="data ? 'Customer' : undefined"
  >
    <div class="portal-content">
      <NuxtLink to="/internal/customers" class="portal-link">← Customers</NuxtLink>
      <template v-if="data">
        <dl class="portal-detail mt-8 grid gap-5 sm:grid-cols-2">
          <div>
            <dt>Email</dt>
            <dd class="mt-1 break-all font-semibold">{{ data.customer.email }}</dd>
          </div>
          <div>
            <dt>Email status</dt>
            <dd class="mt-1 font-semibold">
              {{ data.customer.emailVerified ? 'Verified' : 'Unverified' }}
            </dd>
          </div>
          <div>
            <dt>Registered</dt>
            <dd class="mt-1 font-semibold">
              <NuxtTime :datetime="data.customer.createdAt" date-style="short" />
            </dd>
          </div>
        </dl>
        <section class="mt-10">
          <h2 class="font-heading text-xl font-semibold">Account memberships</h2>
          <div class="mt-5 overflow-x-auto border-y border-studio-rule">
            <table v-if="data.memberships.length" class="w-full text-left text-sm">
              <thead class="bg-studio-tint">
                <tr>
                  <th scope="col" class="p-3">Account</th>
                  <th scope="col" class="p-3">Type</th>
                  <th scope="col" class="p-3">Role</th>
                  <th scope="col" class="p-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="membership in data.memberships"
                  :key="membership.accountId"
                  class="border-t border-studio-rule"
                >
                  <td class="p-3 font-semibold">{{ membership.accountName }}</td>
                  <td class="p-3 capitalize">{{ membership.accountType }}</td>
                  <td class="p-3 capitalize">{{ membership.role.replace('_', ' ') }}</td>
                  <td class="p-3">
                    <NuxtTime :datetime="membership.joinedAt" date-style="short" />
                  </td>
                </tr>
              </tbody>
            </table>
            <p v-else class="p-5 text-sm text-studio-muted">
              This customer has no account memberships.
            </p>
          </div>
        </section>
      </template>
      <div v-else-if="error" role="alert" class="mt-8">
        <p class="mt-3 text-studio-muted">{{ parseApiError(error).text }}</p>
        <button class="portal-button mt-5" @click="refresh()">Try again</button>
      </div>
    </div>
  </NuxtLayout>
</template>
