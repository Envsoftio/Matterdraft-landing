<script setup lang="ts">
definePageMeta({ layout: false, pageTransition: false })
usePrivatePageSeo(
  'Manage support ticket',
  'Review and manage a support ticket in the staff workspace.',
)
const route = useRoute()
const ticketId = computed(() => String(route.params.ticketId))
</script>
<template>
  <PortalSupportConversation
    :api-path="`/api/internal/tickets/${ticketId}`"
    back-to="/internal/tickets"
    back-label="Support tickets"
    staff
  />
</template>
