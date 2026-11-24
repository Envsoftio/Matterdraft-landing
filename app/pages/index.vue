<script setup lang="ts">
import LandingHeader from '~/components/landing/LandingHeader.vue'
import LandingHero from '~/components/landing/LandingHero.vue'
import LandingEarlyAccess from '~/components/landing/LandingEarlyAccess.vue'
import LandingFeatures from '~/components/landing/LandingFeatures.vue'
import LandingFooter from '~/components/landing/LandingFooter.vue'
import site from '~~/content/site.json'

const { homepage, name, language } = site
useSiteSeo(homepage)
useLandingExperience()

const origin = useRuntimeConfig().public.siteUrl
const canonical = new URL(homepage.path, origin).href
const websiteId = `${canonical}#website`
const softwareId = `${canonical}#software`
const publisherId = `${canonical}#publisher`
const schema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': websiteId,
      url: canonical,
      name,
      alternateName: site.shortName,
      inLanguage: language,
      publisher: { '@id': publisherId },
    },
    {
      '@type': 'WebPage',
      '@id': `${canonical}#webpage`,
      url: canonical,
      name: homepage.title,
      description: homepage.description,
      isPartOf: { '@id': websiteId },
      mainEntity: { '@id': softwareId },
      inLanguage: language,
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: new URL(site.socialImage.path, origin).href,
        width: site.socialImage.width,
        height: site.socialImage.height,
      },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': softwareId,
      name,
      url: canonical,
      description: site.summary,
      creativeWorkStatus: site.status,
      applicationCategory: 'BusinessApplication',
      operatingSystem: site.platforms.join(', '),
      featureList: site.capabilities.map(({ title }) => title),
      publisher: { '@id': publisherId },
    },
    {
      '@type': 'Organization',
      '@id': publisherId,
      name: site.publisher.name,
      url: site.publisher.url,
    },
  ],
}
useHead({
  bodyAttrs: { class: 'landing-page' },
  link: [
    {
      key: 'body-font',
      rel: 'preload',
      href: '/fonts/manrope-latin-variable.woff2',
      as: 'font',
      type: 'font/woff2',
      crossorigin: '',
    },
  ],
  script: [
    {
      key: 'matterdraft-structured-data',
      type: 'application/ld+json',
      textContent: JSON.stringify(schema).replace(/</g, '\\u003c'),
    },
  ],
})
</script>

<template>
  <div id="top" class="studio-landing">
    <LandingHeader />
    <main id="main">
      <LandingHero />
      <LandingEarlyAccess />
      <LandingFeatures />
    </main>
    <LandingFooter />
  </div>
</template>
