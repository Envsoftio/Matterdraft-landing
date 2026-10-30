<script setup lang="ts">
defineProps<{ dark?: boolean }>()
</script>

<template>
  <span class="brand-logo-wrap" :class="{ 'brand-logo-force-dark': dark }">
    <img class="brand-logo brand-logo-light" src="/brand/matterdraft-studio-light.svg" alt="MatterDraft Studio" width="1422" height="386" />
    <img class="brand-logo brand-logo-dark" src="/brand/matterdraft-studio-dark.svg" alt="MatterDraft Studio" width="1419" height="386" />
  </span>
</template>
