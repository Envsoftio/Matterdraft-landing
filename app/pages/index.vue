<script setup lang="ts">
import LandingHeader from '~/components/landing/LandingHeader.vue'
import LandingHero from '~/components/landing/LandingHero.vue'
import LandingFeatures from '~/components/landing/LandingFeatures.vue'
import LandingFooter from '~/components/landing/LandingFooter.vue'
import LandingOverlays from '~/components/landing/LandingOverlays.vue'

const title = 'MatterDraft Studio | Legal Document Workspace'
const description = 'Organise legal documents, OCR scans and prepare indexed, numbered, bookmarked PDF bundles. MatterDraft Studio is in development for Windows and macOS.'
useSiteSeo({ title, description, path: '/', markdownPath: '/index.md' })
useLandingExperience()

const origin = String(useRuntimeConfig().public.siteUrl).replace(/\/+$/, '')
const schema = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebSite', '@id': `${origin}/#website`, url: `${origin}/`, name: 'MatterDraft Studio', inLanguage: 'en-IN' },
    {
      '@type': 'WebPage', '@id': `${origin}/#webpage`, url: `${origin}/`, name: title,
      description, isPartOf: { '@id': `${origin}/#website` },
      mainEntity: { '@id': `${origin}/#software` }, inLanguage: 'en-IN',
      primaryImageOfPage: { '@type': 'ImageObject', url: `${origin}/og/matterdraft-social.jpg`, width: 1200, height: 630 },
    },
    {
      '@type': 'SoftwareApplication', '@id': `${origin}/#software`, name: 'MatterDraft Studio',
      url: `${origin}/`, description,
      applicationCategory: 'BusinessApplication', operatingSystem: 'Windows, macOS',
      creativeWorkStatus: 'In development',
      featureList: [
        'Matter and document organisation', 'PDF page operations', 'OCR-assisted document text',
        'Template-based document generation', 'Document collation', 'Pagination and indexes',
        'PDF bookmark hierarchy', 'Document-aware volume splitting', 'Production validation checks',
      ],
    },
  ],
}
useHead({ script: [{ key: 'matterdraft-structured-data', type: 'application/ld+json', textContent: JSON.stringify(schema).replace(/</g, '\\u003c') }] })
</script>

<template>
  <div class="landing-page">
  <LandingHeader />
  <main id="main">
    <LandingHero />
    <LandingFeatures />
  </main>
  <LandingFooter />
  <LandingOverlays />
  </div>
</template>
