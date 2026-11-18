<script setup lang="ts">
definePageMeta({ layout: 'portal' })
useHead({ title: 'Support ticket · MatterDraft Studio' })
const route = useRoute()
const ticketId = computed(() => String(route.params.ticketId))
</script>
<template><div class="portal-content"><NuxtLink class="portal-link mb-6 inline-block" to="/internal/tickets">← Support tickets</NuxtLink><PortalSupportConversation :api-path="`/api/internal/tickets/${ticketId}`" staff /></div></template>
