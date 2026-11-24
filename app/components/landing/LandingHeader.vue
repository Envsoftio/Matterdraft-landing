<script setup lang="ts">
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from 'reka-ui'
import { ArrowUpRight, Menu, UserRound, X, Zap } from '@lucide/vue'
import site from '~~/content/site.json'

const links = [
  ['Product', '#product'],
  ['PDF Tools', '#pdf-engine'],
  ['Workflow', '#workflow'],
  ['Automation', '#automation'],
  ['Document Privacy', '#local-processing'],
  ['FAQ', '#faq'],
] as const
const current = ref('')
const heroPassed = ref(false)
let navigationObserver: IntersectionObserver | undefined
let heroObserver: IntersectionObserver | undefined

onMounted(() => {
  if (!('IntersectionObserver' in window)) return

  navigationObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) if (entry.isIntersecting) current.value = '#' + entry.target.id
    },
    { rootMargin: '-8% 0px -48% 0px' },
  )
  for (const [, href] of links) {
    const element = document.querySelector(href)
    if (element) navigationObserver.observe(element)
  }

  const hero = document.getElementById('landing-hero')
  if (hero) {
    heroObserver = new IntersectionObserver(([entry]) => {
      if (entry) heroPassed.value = !entry.isIntersecting && entry.boundingClientRect.bottom <= 0
    })
    heroObserver.observe(hero)
  }
})

onBeforeUnmount(() => {
  navigationObserver?.disconnect()
  heroObserver?.disconnect()
})
</script>

<template>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="studio-header">
    <div class="frame header-inner">
      <a href="#top" aria-label="MatterDraft Studio home"><BrandLogo /></a>
      <nav aria-label="Main navigation" class="studio-nav">
        <a
          v-for="[name, href] in links"
          :key="href"
          :href="href"
          :class="{ current: current === href }"
          :aria-current="current === href ? 'location' : undefined"
          @click="current = href"
        >
          {{ name }}
        </a>
      </nav>
      <div class="header-actions">
        <a
          class="action primary header-access"
          :class="{ 'header-access-hidden': !heroPassed }"
          href="#early-access"
        >
          <Zap aria-hidden="true" />
          Early access
        </a>
        <ThemeToggle />
        <NuxtLink to="/portal" class="header-portal-link" aria-label="Account portal">
          <UserRound :size="17" aria-hidden="true" />
        </NuxtLink>
        <DropdownMenuRoot>
          <DropdownMenuTrigger class="mobile-links-trigger" aria-label="Navigation">
            <Menu :size="20" aria-hidden="true" />
            <X :size="20" aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuPortal>
            <DropdownMenuContent
              align="end"
              :side-offset="8"
              :collision-padding="16"
              class="studio-options landing-mobile-nav"
            >
              <DropdownMenuItem
                v-for="([name, href], index) in links"
                :key="href"
                :style="{ '--nav-delay': `${index * 60}ms` }"
                as-child
              >
                <a
                  class="studio-option"
                  :href="href"
                  :aria-current="current === href ? 'location' : undefined"
                  @click="current = href"
                >
                  {{ name }}
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator class="menu-divider" />
              <DropdownMenuItem as-child>
                <NuxtLink to="/portal" class="studio-option">
                  Account portal
                  <ArrowUpRight :size="14" />
                </NuxtLink>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenuRoot>
      </div>
    </div>
  </header>
  <div class="frame landing-utility">
    <span>Desktop app for {{ site.platforms.join(' and ') }}</span>
  </div>
</template>
