<script setup lang="ts">
import { ArrowUpRight } from '@lucide/vue'
import site from '~~/content/site.json'

defineProps<{ policy?: boolean }>()
</script>
<template>
  <footer class="studio-footer">
    <div class="frame">
      <div class="footer-columns">
        <div>
          <NuxtLink :to="policy ? '/' : '/#top'" aria-label="MatterDraft Studio home"
            ><BrandLogo
          /></NuxtLink>
          <p>Prepare case files and indexed court bundles on your own computer.</p>
          <p class="footer-survey">
            <a
              id="advocate-survey-footer"
              class="survey-link text-action"
              :href="site.advocateSurveyUrl"
              target="_blank"
              rel="noopener noreferrer"
            >
              Advocate survey on Google Forms
              <ArrowUpRight :size="14" aria-hidden="true" />
            </a>
          </p>
          <span class="footer-privacy-note">On-device processing</span>
        </div>
        <nav aria-label="Product links">
          <strong>Product</strong>
          <NuxtLink to="/#pdf-engine">PDF tools</NuxtLink>
          <NuxtLink to="/#ocr">Scanned pages &amp; OCR</NuxtLink>
          <NuxtLink to="/#automation">Bundle indexing</NuxtLink>
          <NuxtLink to="/#workflow">Bundle workflow</NuxtLink>
          <NuxtLink to="/#faq">Frequently asked questions</NuxtLink>
        </nav>
        <nav aria-label="Legal and account links">
          <strong>Help and policies</strong>
          <NuxtLink to="/privacy">Privacy</NuxtLink>
          <NuxtLink to="/terms">Terms</NuxtLink>
          <NuxtLink to="/refund-policy">Refund policy</NuxtLink>
          <NuxtLink to="/portal">Account portal</NuxtLink>
          <a href="mailto:hello@matterdraft.legal">Contact support</a>
        </nav>
      </div>
      <div class="footer-baseline">
        <span>Built in India for legal teams</span>
        <span>
          MatterDraft Studio{{ ' ' }}
          <span aria-hidden="true" class="mx-2 align-middle text-2xl leading-none font-bold"
            >·</span
          >
          {{ ' ' }}An{{ ' ' }}
          <a :href="site.publisher.url" class="mx-1" rel="noopener noreferrer" target="_blank">
            {{ site.publisher.name }} </a>{{ ' ' }}
          venture
        </span>
      </div>
    </div>
  </footer>
</template>
