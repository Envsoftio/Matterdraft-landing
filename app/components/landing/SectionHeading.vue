<script setup lang="ts">
defineProps<{ label: string; title: string; description: string; layout?: 'stack' | 'center' }>()
</script>

<template>
  <header class="section-heading" :class="layout">
    <div>
      <p class="section-kicker">{{ label }}</p>
      <h2>{{ title }}</h2>
    </div>
    <p class="section-description">{{ description }}</p>
  </header>
</template>
