<script setup lang="ts">
defineProps<{ title: string; description: string; layout?: 'stack' | 'center' }>()
</script>

<template>
  <header class="section-heading" :class="layout">
    <h2>{{ title }}</h2>
    <p class="section-description">{{ description }}</p>
  </header>
</template>
