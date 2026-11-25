<script setup lang="ts">
import { parseApiError } from '~/utils/api-error'
definePageMeta({ layout: false, pageTransition: false })
usePrivatePageSeo(
  'Organisation activity',
  'Review recent membership and ownership changes for your organisation.',
)
const route = useRoute()
const id = String(route.params.accountId)
const { data, error, pending, refresh } = useLazyFetch<{
  events: {
    event_type: string
    subject_id: string
    created_at: number
    actor_user_id: string
  }[]
}>(`/api/membership/accounts/${id}/audit`)
const eventLabels: Record<string, string> = {
  'organisation.created': 'Organisation created',
  'invitation.created': 'Invitation sent',
  'invitation.revoked': 'Invitation revoked',
  'invitation.reissued': 'Invitation sent again',
  'invitation.accepted': 'Invitation accepted',
  'membership.role_changed': 'Member role changed',
  'membership.removed': 'Member removed',
  'ownership.transfer_requested': 'Ownership transfer requested',
  'ownership.transferred': 'Ownership transferred',
}
</script>
<template>
  <NuxtLayout
    :loading="!data && !error"
    :pending="pending"
    name="portal"
    title="Activity"
    description="Recent changes to this organisation."
  >
    <div class="portal-content">
      <NuxtLink :to="`/a/${id}/members`" class="portal-link">← Members</NuxtLink>
      <p v-if="error" role="alert" class="portal-error mt-6">
        {{ parseApiError(error).text }}
        <button class="portal-link ml-2" :disabled="pending" @click="refresh()">Try again</button>
      </p>
      <div v-else class="mt-8 divide-y divide-studio-rule border-y border-studio-rule">
        <div
          v-for="item in data?.events"
          :key="item.event_type + item.created_at"
          class="flex flex-wrap justify-between gap-3 py-4 text-sm"
        >
          <span class="font-semibold">{{
            eventLabels[item.event_type] || 'Organisation updated'
          }}</span><NuxtTime
            class="text-studio-muted"
            :datetime="item.created_at"
            date-style="short"
            time-style="medium"
          />
        </div>
        <p v-if="!data?.events.length" class="py-5 text-sm text-studio-muted">No activity yet.</p>
      </div>
    </div>
  </NuxtLayout>
</template>
