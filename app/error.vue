<script setup lang="ts">
import type { NuxtError } from '#app'
import { NO_INDEX } from '~~/scripts/discovery.mjs'
const props = defineProps<{ error: NuxtError }>()
const path = useRequestURL().pathname
const accountArea = /^\/(portal|internal|a|invite)(\/|$)/.test(path)
const reference = computed(() => {
  const data = props.error.data as { error?: { requestId?: unknown } } | undefined
  const id = data?.error?.requestId
  return typeof id === 'string' && /^req_[0-9a-f]{24}$/.test(id) ? id : ''
})
usePrivatePageSeo('Page unavailable', 'Return to MatterDraft Studio or try opening the page again.')
useResponseHeader('X-Robots-Tag').value = NO_INDEX
const home = () => clearError({ redirect: accountArea ? '/portal' : '/' })
</script>
<template>
  <main class="error-page flex min-h-screen items-center justify-center bg-mist px-6 text-ink">
    <div class="max-w-xl py-20">
      <div class="mb-6 flex justify-end"><ThemeToggle /></div>
      <div class="mb-8"><BrandLogo class="error-logo" /></div>
      <p class="mb-4 text-xs font-semibold tracking-[0.18em] text-brand uppercase">
        {{ error.statusCode || 500 }}
      </p>
      <h1 class="text-4xl leading-tight font-medium tracking-tight">
        {{
          error.statusCode === 404
            ? 'We couldn’t find that page.'
            : 'This page could not be loaded.'
        }}
      </h1>
      <p class="mt-5 text-base leading-7 text-slate-600">
        {{
          accountArea
            ? 'Return to your accounts and try opening the page again.'
            : 'Return to MatterDraft Studio and try again.'
        }}
      </p>
      <p v-if="reference" class="mt-4 text-sm text-slate-600">Support reference: {{ reference }}</p>
      <button type="button" class="action primary mt-8" @click="home">
        {{ accountArea ? 'Your accounts' : 'Back to MatterDraft' }}
      </button>
    </div>
  </main>
</template>
