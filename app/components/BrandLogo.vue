<script setup lang="ts">
defineProps<{ dark?: boolean }>()
</script>

<template>
  <span class="brand-logo-wrap" :class="{ 'brand-logo-force-dark': dark }">
    <img
      class="brand-logo brand-logo-light"
      src="/brand/studio-wordmark-light.png"
      alt="MatterDraft Studio"
      width="220"
      height="44"
    />
    <img
      class="brand-logo brand-logo-dark"
      src="/brand/studio-wordmark-dark.png"
      alt="MatterDraft Studio"
      width="220"
      height="44"
    />
  </span>
</template>
