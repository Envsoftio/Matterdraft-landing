<script setup lang="ts">
defineProps<{ policy?: boolean }>()
</script>

<template>
  <footer class="site-footer" data-pen-name="Footer">
    <div class="container">
      <div class="footer-top">
        <NuxtLink class="brand" :to="policy ? '/' : '/#top'" :prefetch="false" aria-label="MatterDraft Studio home">
          <BrandLogo />
        </NuxtLink>
        <nav class="footer-links" aria-label="Footer navigation">
          <NuxtLink to="/#product" :prefetch="false">Product</NuxtLink>
          <NuxtLink to="/#pdf-engine" :prefetch="false">Features</NuxtLink>
          <NuxtLink to="/#workflow" :prefetch="false">Workflow</NuxtLink>
          <NuxtLink to="/#local-processing" :prefetch="false">Local Processing</NuxtLink>
          <NuxtLink to="/privacy" :prefetch="false">Privacy</NuxtLink>
          <NuxtLink to="/terms" :prefetch="false">Terms</NuxtLink>
          <NuxtLink to="/refund-policy" :prefetch="false">Refund policy</NuxtLink>
        </nav>
      </div>
      <div class="footer-bottom">
        <p class="footer-summary">Legal document processing.<br>Structured workflow. Local-first control.</p>
        <div class="footer-signature">
          <span class="footer-signature-main">
            <svg class="footer-signature-sparkle icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3ZM19 17l.6 1.4L21 19l-1.4.6L19 21l-.6-1.4L17 19l1.4-.6L19 17Z" /></svg>
            Built with ❤️ in भारत. Made for the world.
          </span>
          <span class="footer-signature-credit">An <a href="https://envsoft.io/?utm_source=matterdraft&amp;utm_medium=footer&amp;utm_campaign=brand_attribution" target="_blank" rel="noopener noreferrer">Envsoft Solutions LLP</a> venture</span>
        </div>
      </div>
    </div>
  </footer>
</template>
