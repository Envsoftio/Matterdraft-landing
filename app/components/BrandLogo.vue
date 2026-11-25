<script setup lang="ts">
defineProps<{ dark?: boolean }>()
</script>

<template>
  <span class="brand-logo-wrap" :class="{ 'brand-logo-force-dark': dark }">
    <img
      class="brand-logo brand-logo-light"
      src="/brand/studio-wordmark-light.svg"
      alt="MatterDraft Studio"
      width="220"
      height="47"
    />
    <img
      class="brand-logo brand-logo-dark"
      src="/brand/studio-wordmark-dark.svg"
      alt="MatterDraft Studio"
      width="220"
      height="47"
    />
  </span>
</template>
