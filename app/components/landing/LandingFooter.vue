<script setup lang="ts">
defineProps<{ policy?: boolean }>()
</script>
<template>
  <footer class="studio-footer">
    <div class="frame">
      <div class="footer-columns">
        <div>
          <NuxtLink :to="policy ? '/' : '/#top'" aria-label="MatterDraft Studio home"><BrandLogo /></NuxtLink>
          <p>
            Prepare case files and indexed court bundles on your own computer.
          </p>
          <div class="footer-badges">
            <span>On-device processing</span>
          </div>
        </div>
        <nav aria-label="Product links">
          <strong>Product</strong>
          <NuxtLink to="/#pdf-engine">PDF tools</NuxtLink>
          <NuxtLink to="/#ocr">Scanned pages &amp; OCR</NuxtLink>
          <NuxtLink to="/#automation">Bundle indexing</NuxtLink>
          <NuxtLink to="/#workflow">Bundle workflow</NuxtLink>
        </nav>
        <nav aria-label="Legal and account links">
          <strong>Legal &amp; account</strong>
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
          MatterDraft Studio · An
          <a
            href="https://envsoft.io/"
            rel="noopener noreferrer"
            target="_blank"
          >
            Envsoft Solutions LLP
          </a>
          venture
        </span>
      </div>
    </div>
  </footer>
</template>
