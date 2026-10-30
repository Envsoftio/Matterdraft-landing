<script setup lang="ts">
import policy from '~/data/legal/refund-policy'
import PolicyPage from '~/components/PolicyPage.vue'
</script>
<template><PolicyPage v-bind="policy" /></template>
