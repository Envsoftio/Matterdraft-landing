<script setup lang="ts">
import { Moon, Sun } from '@lucide/vue'

const theme = useState<'light' | 'dark' | null>('studio-theme', () => null)
const label = computed(() => {
  if (theme.value === null) return 'Switch color theme'
  return theme.value === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
})

onMounted(() => {
  theme.value = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
})
</script>
<template>
  <button
    type="button"
    class="theme-toggle"
    :aria-label="label"
    :title="label"
    @click="theme = toggleStudioTheme()"
  >
    <Sun class="icon icon-sun" aria-hidden="true" />
    <Moon class="icon icon-moon" aria-hidden="true" />
  </button>
</template>
