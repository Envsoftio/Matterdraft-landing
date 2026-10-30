<script setup lang="ts">
import type { NuxtError } from '#app'
const props = defineProps<{ error: NuxtError }>()
useSeoMeta({ title: 'Page not found | MatterDraft Studio', robots: 'noindex, follow' })
const home = () => clearError({ redirect: '/' })
</script>
<template>
  <main class="error-page flex min-h-screen items-center justify-center bg-mist px-6 text-ink">
    <div class="max-w-xl py-20">
      <div class="mb-6 flex justify-end"><ThemeToggle /></div>
      <div class="mb-8"><BrandLogo class="error-logo" /></div>
      <p class="mb-4 text-xs font-semibold tracking-[0.18em] text-brand uppercase">{{ error.statusCode || 500 }}</p>
      <h1 class="text-4xl leading-tight font-medium tracking-tight">{{ error.statusCode === 404 ? 'This page isn’t in the bundle.' : 'This page could not be loaded.' }}</h1>
      <p class="mt-5 text-base leading-7 text-slate-600">Return to MatterDraft Studio to explore the document workspace.</p>
      <button type="button" class="button mt-8" @click="home">Back to MatterDraft</button>
    </div>
  </main>
</template>
