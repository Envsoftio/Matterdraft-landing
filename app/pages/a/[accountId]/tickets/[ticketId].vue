<script setup lang="ts">
definePageMeta({ layout: false, pageTransition: false })
usePrivatePageSeo('Support ticket', 'View and reply to a ticket for your MatterDraft account.')
const route = useRoute()
const accountId = computed(() => String(route.params.accountId))
const ticketId = computed(() => String(route.params.ticketId))
</script>
<template>
  <PortalSupportConversation
    :api-path="`/api/accounts/${accountId}/tickets/${ticketId}`"
    :back-to="`/a/${accountId}/tickets`"
    back-label="Your tickets"
  />
</template>
