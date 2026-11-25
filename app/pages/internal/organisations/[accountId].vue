<script setup lang="ts">
import { parseApiError } from '~/utils/api-error'

definePageMeta({ layout: false, pageTransition: false })
usePrivatePageSeo(
  'Organisation details',
  'Review an organisation and its members in the staff workspace.',
)

type Detail = {
  organisation: { id: string; name: string; createdAt: number }
  members: { userId: string; name: string; email: string; role: string; joinedAt: number }[]
  invitations: {
    id: string
    email: string
    role: string
    type: string
    status: string
    createdAt: number
    expiresAt: number
  }[]
}
const route = useRoute()
const accountId = computed(() => String(route.params.accountId))
const { data, error, refresh, pending } = useLazyFetch<Detail>(
  () => `/api/internal/organisations/${encodeURIComponent(accountId.value)}`,
  { watch: [accountId] },
)
</script>

<template>
  <NuxtLayout
    :loading="!data && !error"
    :pending="pending"
    name="portal"
    :title="data?.organisation.name || (error ? 'Organisation unavailable' : 'Organisation')"
  >
    <template v-if="data" #description>
      Organisation · Created <NuxtTime :datetime="data.organisation.createdAt" date-style="short" />
    </template>
    <div class="portal-content">
      <NuxtLink to="/internal/organisations" class="portal-link">← Organisations</NuxtLink>
      <template v-if="data">
        <section class="mt-10">
          <h2 class="font-heading text-xl font-semibold">Members</h2>
          <div class="mt-5 overflow-x-auto border-y border-studio-rule">
            <table v-if="data.members.length" class="w-full text-left text-sm">
              <thead class="bg-studio-tint">
                <tr>
                  <th scope="col" class="p-3">Member</th>
                  <th scope="col" class="p-3">Email</th>
                  <th scope="col" class="p-3">Role</th>
                  <th scope="col" class="p-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="member in data.members"
                  :key="member.userId"
                  class="border-t border-studio-rule"
                >
                  <td class="p-3 font-semibold">
                    <NuxtLink class="portal-link" :to="`/internal/customers/${member.userId}`">{{
                      member.name
                    }}</NuxtLink>
                  </td>
                  <td class="p-3">{{ member.email }}</td>
                  <td class="p-3 capitalize">{{ member.role.replace('_', ' ') }}</td>
                  <td class="p-3"><NuxtTime :datetime="member.joinedAt" date-style="short" /></td>
                </tr>
              </tbody>
            </table>
            <p v-else class="p-5 text-sm text-studio-muted">No members found.</p>
          </div>
        </section>
        <section class="mt-10">
          <h2 class="font-heading text-xl font-semibold">Open invitations</h2>
          <p class="mt-2 text-sm text-studio-muted">
            Pending and expired invitations. The 100 most recent are shown.
          </p>
          <div class="mt-5 overflow-x-auto border-y border-studio-rule">
            <table v-if="data.invitations.length" class="w-full text-left text-sm">
              <thead class="bg-studio-tint">
                <tr>
                  <th scope="col" class="p-3">Invited email</th>
                  <th scope="col" class="p-3">Purpose</th>
                  <th scope="col" class="p-3">Status</th>
                  <th scope="col" class="p-3">Expires</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="invitation in data.invitations"
                  :key="invitation.id"
                  class="border-t border-studio-rule"
                >
                  <td class="p-3">{{ invitation.email }}</td>
                  <td class="p-3">
                    {{
                      invitation.type === 'transfer'
                        ? 'Ownership transfer'
                        : `Membership · ${invitation.role.replace('_', ' ')}`
                    }}
                  </td>
                  <td class="p-3 capitalize">{{ invitation.status }}</td>
                  <td class="p-3">
                    <NuxtTime :datetime="invitation.expiresAt" date-style="short" />
                  </td>
                </tr>
              </tbody>
            </table>
            <p v-else class="p-5 text-sm text-studio-muted">No open invitations.</p>
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
