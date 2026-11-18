<script setup lang="ts">
import { Moon, Sun } from '@lucide/vue'
</script>
<template>
  <button
    type="button"
    class="theme-toggle"
    aria-label="Switch color theme"
    title="Switch color theme"
    @click="toggleStudioTheme()"
  >
    <Sun class="icon icon-sun" aria-hidden="true" />
    <Moon class="icon icon-moon" aria-hidden="true" />
  </button>
</template>
