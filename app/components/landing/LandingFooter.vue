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
            A local-first desktop workspace for legal drafting and bundle preparation. Organise case files,
            review working copies, and export indexed, paginated bundles.
          </p>
          <div class="footer-badges">
            <span>Offline-first</span>
            <span>Local processing</span>
          </div>
        </div>
        <nav aria-label="Product links">
          <strong>Product</strong>
          <NuxtLink to="/#pdf-engine">PDF tools</NuxtLink>
          <NuxtLink to="/#ocr">Scanned pages &amp; OCR</NuxtLink>
          <NuxtLink to="/#automation">Bundle indexing</NuxtLink>
          <NuxtLink to="/#workflow">Production workflow</NuxtLink>
        </nav>
        <nav aria-label="Legal and account links">
          <strong>Legal &amp; account</strong>
          <NuxtLink to="/privacy">Privacy</NuxtLink>
          <NuxtLink to="/terms">Terms</NuxtLink>
          <NuxtLink to="/refund-policy">Refund policy</NuxtLink>
          <NuxtLink to="/portal">Account portal</NuxtLink>
        </nav>
      </div>
      <div class="footer-baseline">
        <span>Built with ❤️ in भारत for advocates globally</span>
        <span>
          MatterDraft Studio · An
          <a
            href="https://envsoft.io/?utm_source=matterdraft&amp;utm_medium=footer&amp;utm_campaign=brand_attribution"
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
