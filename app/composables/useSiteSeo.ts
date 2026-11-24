import site from '~~/content/site.json'
import { NO_INDEX } from '~~/scripts/discovery.mjs'

export interface PageSeo {
  title: string
  description: string
  path: string
  markdownPath?: string
  legalSlug?: string
}

/** Public documents derive canonical and social URLs from the configured origin. */
export function useSiteSeo(page: PageSeo): void {
  const config = useRuntimeConfig().public
  const canonical = new URL(page.path, config.siteUrl).href
  const image = new URL(site.socialImage.path, config.siteUrl).href
  const indexable = ['true', '1'].includes(String(config.indexable).toLowerCase())

  const markdownAlternate =
    indexable && page.markdownPath
      ? [
          {
            key: 'markdown-alternate',
            rel: 'alternate' as const,
            type: 'text/markdown',
            href: new URL(page.markdownPath, config.siteUrl).href,
          },
        ]
      : []

  useSeoMeta({
    title: page.title,
    description: page.description,
    robots: indexable ? 'index, follow, max-image-preview:large' : NO_INDEX,
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
    link: [{ key: 'canonical', rel: 'canonical', href: canonical }, ...markdownAlternate],
  })

  // Inject breadcrumb structured data for policy pages
  if (page.legalSlug) {
    const breadcrumbId = `${canonical}#breadcrumb`
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      '@id': breadcrumbId,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: config.siteUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Policies',
          item: new URL('/privacy', config.siteUrl).href,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: page.title.replace(' | MatterDraft Studio', ''),
          item: canonical,
        },
      ],
    }
    useHead({
      script: [
        {
          key: 'breadcrumb-' + page.legalSlug,
          type: 'application/ld+json',
          textContent: JSON.stringify(breadcrumbSchema).replace(/</g, '\\u003c'),
        },
      ],
    })
  }
}
