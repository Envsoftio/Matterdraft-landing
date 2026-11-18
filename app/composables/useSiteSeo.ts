import site from '~~/content/site.json'
import { DRAFT_ROBOTS, NO_INDEX } from '~~/scripts/discovery.mjs'

export interface PageSeo {
  title: string
  description: string
  path: string
  indexable?: boolean
  markdownPath?: string
}

/** Public documents derive canonical and social URLs from the configured origin. */
export function useSiteSeo(page: PageSeo): void {
  const config = useRuntimeConfig().public
  const canonical = new URL(page.path, config.siteUrl).href
  const image = new URL(site.socialImage.path, config.siteUrl).href
  const indexingEnabled = ['true', '1'].includes(String(config.indexable).toLowerCase())
  const indexable = indexingEnabled && page.indexable !== false

  useSeoMeta({
    title: page.title,
    description: page.description,
    robots: indexable ? 'index, follow, max-image-preview:large' : indexingEnabled ? DRAFT_ROBOTS : NO_INDEX,
    ogType: 'website',
    ogSiteName: site.name,
    ogLocale: site.language.replace('-', '_'),
    ogTitle: page.title,
    ogDescription: page.description,
    ogUrl: canonical,
    ogImage: image,
    ogImageWidth: site.socialImage.width,
    ogImageHeight: site.socialImage.height,
    ogImageAlt: site.socialImage.alt,
    twitterCard: 'summary_large_image',
    twitterTitle: page.title,
    twitterDescription: page.description,
    twitterImage: image,
    twitterImageAlt: site.socialImage.alt,
  })

  useHead({
    link: [
      { key: 'canonical', rel: 'canonical', href: canonical },
      ...(indexable && page.markdownPath ? [{
        key: 'markdown-alternate', rel: 'alternate' as const, type: 'text/markdown',
        href: new URL(page.markdownPath, config.siteUrl).href,
      }] : []),
    ],
  })
}
