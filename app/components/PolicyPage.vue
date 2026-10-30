<script setup lang="ts">
import LandingFooter from '~/components/landing/LandingFooter.vue'

const props = defineProps<{ title: string; description: string; slug: string; html: string }>()
const config = useRuntimeConfig()
const published = config.public.legalPublished === true || String(config.public.legalPublished) === 'true'
useSiteSeo({
  title: `${props.title} | MatterDraft Studio`, description: props.description,
  path: `/${props.slug}`, indexable: published,
  markdownPath: published ? `/legal/${props.slug}.md` : undefined,
})
</script>

<template>
  <div class="min-h-screen bg-white text-ink flex flex-col">
    <a class="skip-link" href="#policy-content">Skip to policy</a>
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-5">
        <NuxtLink to="/" :prefetch="false" class="flex items-center gap-3 text-ink" aria-label="MatterDraft Studio home">
          <img src="/brand/matterdraft-mark.svg" width="40" height="40" alt="" class="h-10 w-10" />
          <span class="text-lg font-semibold tracking-tight">MatterDraft <span class="font-normal text-slate-500">Studio</span></span>
        </NuxtLink>
        <NuxtLink to="/" :prefetch="false" class="text-sm font-medium text-brand underline-offset-4 hover:underline">Back to the workspace</NuxtLink>
      </div>
    </header>
    <main id="policy-content" class="mx-auto max-w-4xl px-6 py-14 sm:py-20 flex-1 w-full">
      <p class="mb-4 text-xs font-semibold tracking-[0.18em] text-brand uppercase">MatterDraft Studio</p>
      <h1 class="max-w-3xl text-4xl leading-tight font-medium tracking-tight text-ink sm:text-5xl">{{ title }}</h1>
      <aside v-if="!published" class="mt-8 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-950" aria-label="Draft policy status">
        <strong class="font-semibold">Review draft.</strong> The business and service details marked below need to be completed before this policy is published. This draft is excluded from search indexing.
      </aside>
      <!-- Trusted, repository-owned Markdown is converted to HTML at build time. -->
      <article class="policy-prose mt-10" v-html="html" />
    </main>
    <LandingFooter policy />
  </div>
</template>

<style>
.policy-prose { color: #3e4f65; font-size: 15px; line-height: 1.8; overflow-wrap: anywhere; }
.policy-prose h2 { margin: 2.5rem 0 1rem; color: #14263d; font-size: 1.55rem; line-height: 1.35; letter-spacing: -.025em; font-weight: 600; }
.policy-prose h3 { margin: 1.75rem 0 .75rem; color: #14263d; font-size: 1.15rem; line-height: 1.4; font-weight: 600; }
.policy-prose p { margin: 1rem 0; }
.policy-prose ul, .policy-prose ol { margin: 1rem 0; padding-left: 1.4rem; }
.policy-prose ul { list-style: disc; } .policy-prose ol { list-style: decimal; }
.policy-prose li { margin: .5rem 0; }
.policy-prose strong { color: #14263d; font-weight: 600; }
.policy-prose a { color: #245cdb; text-decoration: underline; text-underline-offset: 3px; }
.policy-prose table { width: 100%; margin: 1.5rem 0; border-collapse: collapse; font-size: .875rem; }
.policy-prose th, .policy-prose td { border: 1px solid #dce4ee; padding: .75rem; text-align: left; vertical-align: top; }
.policy-prose th { color: #14263d; background: #f5f7fb; font-weight: 600; }
.policy-prose blockquote { margin: 1rem 0; border-left: 3px solid #c8d6eb; padding-left: 1rem; }
.policy-prose code { font-size: .9em; background: #f0f4f9; border-radius: 4px; padding: .1em .3em; }
@media (max-width: 600px) { .policy-prose table { font-size: .75rem; } .policy-prose th, .policy-prose td { padding: .5rem; } }
</style>
