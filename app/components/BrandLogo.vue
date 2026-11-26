<script setup lang="ts">
defineProps<{ dark?: boolean }>()
</script>

<template>
  <span class="brand-logo-wrap" :class="{ 'brand-logo-force-dark': dark }">
    <picture class="brand-logo-light">
      <source srcset="/brand/studio-wordmark-light.svg" type="image/svg+xml" />
      <img
        class="brand-logo"
        src="/brand/studio-wordmark-light.png"
        alt="MatterDraft Studio"
        width="220"
        height="47"
      />
    </picture>
    <picture class="brand-logo-dark">
      <source srcset="/brand/studio-wordmark-dark.svg" type="image/svg+xml" />
      <img
        class="brand-logo"
        src="/brand/studio-wordmark-dark.png"
        alt="MatterDraft Studio"
        width="220"
        height="47"
      />
    </picture>
  </span>
</template>
