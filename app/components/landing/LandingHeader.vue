<script setup lang="ts">
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from 'reka-ui'
import { ArrowUpRight, Menu, UserRound, Zap } from '@lucide/vue'
const links = [
  ['Product', '#product'],
  ['PDF Tools', '#pdf-engine'],
  ['Workflow', '#workflow'],
  ['Automation', '#automation'],
  ['Document Privacy', '#local-processing'],
] as const
const current = ref('#product')
onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) if (entry.isIntersecting) current.value = '#' + entry.target.id
    },
    { rootMargin: '-8% 0px -48% 0px' },
  )
  for (const [, href] of links) {
    const element = document.querySelector(href)
    if (element) observer.observe(element)
  }
  onBeforeUnmount(() => observer.disconnect())
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
          @click="current = href"
        >
          {{ name }}
        </a>
      </nav>
      <div class="header-actions">
        <ThemeToggle />
        <a class="action primary small" href="#early-access">
          <Zap />
          Early Access
        </a>
        <NuxtLink to="/portal" class="header-portal-link" aria-label="Account portal">
          <UserRound :size="17" aria-hidden="true" />
        </NuxtLink>
        <DropdownMenuRoot>
          <DropdownMenuTrigger class="mobile-links-trigger" aria-label="Open navigation">
            <Menu :size="20" />
          </DropdownMenuTrigger>
          <DropdownMenuPortal>
            <DropdownMenuContent align="end" :side-offset="8" class="studio-options">
              <DropdownMenuItem v-for="[name, href] in links" :key="href" as-child>
                <a class="studio-option" :href="href" @click="current = href">{{ name }}</a>
              </DropdownMenuItem>
              <DropdownMenuSeparator class="menu-divider" />
              <DropdownMenuItem as-child>
                <NuxtLink to="/portal" class="studio-option">
                  Open portal
                  <ArrowUpRight :size="14" />
                </NuxtLink>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenuRoot>
      </div>
    </div>
  </header>
  <div class="preview-banner">
    <div>
      <span class="preview-pill">Early preview</span>
      <span>For Windows and macOS</span>
    </div>
    <a href="https://forms.gle/oZ4ziNTZoQ3QWEoh6" target="_blank" rel="noopener noreferrer">
      Advocate survey on Google Forms
      <ArrowUpRight :size="14" />
    </a>
  </div>
</template>
