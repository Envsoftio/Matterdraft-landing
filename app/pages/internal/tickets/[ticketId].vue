<script setup lang="ts">
definePageMeta({ layout: 'portal' })
usePrivatePageSeo('Manage support ticket', 'Review and manage a support ticket in the staff workspace.')
const route = useRoute()
const ticketId = computed(() => String(route.params.ticketId))
</script>
<template><div class="portal-content"><NuxtLink class="portal-link mb-6 inline-block" to="/internal/tickets">← Support tickets</NuxtLink><PortalSupportConversation :api-path="`/api/internal/tickets/${ticketId}`" staff /></div></template>
