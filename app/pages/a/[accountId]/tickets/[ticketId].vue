<script setup lang="ts">
definePageMeta({ layout: 'portal' })
usePrivatePageSeo('Support ticket', 'View and reply to a ticket for your MatterDraft account.')
const route = useRoute()
const accountId = computed(() => String(route.params.accountId))
const ticketId = computed(() => String(route.params.ticketId))
</script>
<template>
  <div class="portal-content customer-content customer-page">
    <NuxtLink
      class="customer-back-link customer-back-link-top body-6"
      :to="`/a/${accountId}/tickets`"
      >Your tickets</NuxtLink
    ><PortalSupportConversation :api-path="`/api/accounts/${accountId}/tickets/${ticketId}`" />
  </div>
</template>
