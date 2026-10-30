<script setup lang="ts">
import type { NuxtError } from '#app'
const props = defineProps<{ error: NuxtError }>()
useSeoMeta({ title: 'Page not found | MatterDraft Studio', robots: 'noindex, follow' })
const home = () => clearError({ redirect: '/' })
</script>
<template>
  <main class="flex min-h-screen items-center justify-center bg-mist px-6 text-ink">
    <div class="max-w-xl py-20">
      <img src="/brand/matterdraft-mark.svg" alt="MatterDraft Studio" width="56" height="56" class="mb-8 h-14 w-14" />
      <p class="mb-4 text-xs font-semibold tracking-[0.18em] text-brand uppercase">{{ error.statusCode || 500 }}</p>
      <h1 class="text-4xl leading-tight font-medium tracking-tight">{{ error.statusCode === 404 ? 'This page isn’t in the bundle.' : 'This page could not be loaded.' }}</h1>
      <p class="mt-5 text-base leading-7 text-slate-600">Return to MatterDraft Studio to explore the document workspace.</p>
      <button type="button" class="mt-8 rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700" @click="home">Back to MatterDraft</button>
    </div>
  </main>
</template>
