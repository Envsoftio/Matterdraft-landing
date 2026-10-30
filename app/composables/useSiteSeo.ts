export interface PageSeo {
  title: string
  description: string
  path: string
  indexable?: boolean
  markdownPath?: string
}

/** Every page derives its canonical and social URLs from the same site origin. */
export function useSiteSeo(page: PageSeo): void {
  const config = useRuntimeConfig()
  const origin = String(config.public.siteUrl).replace(/\/+$/, '')
  const canonical = new URL(page.path, origin).href
  const image = new URL('/og/matterdraft-social.jpg', origin).href
  const enabled = (value: unknown) => value === true || value === 'true'
  const indexable = enabled(config.public.indexable) && page.indexable !== false

  useSeoMeta({
    title: page.title,
    description: page.description,
    robots: indexable ? 'index, follow, max-image-preview:large' : 'noindex, follow',
    ogType: 'website',
    ogSiteName: 'MatterDraft Studio',
    ogLocale: 'en_IN',
    ogTitle: page.title,
    ogDescription: page.description,
    ogUrl: canonical,
    ogImage: image,
    ogImageWidth: 1200,
    ogImageHeight: 630,
    ogImageAlt: 'MatterDraft Studio — complex legal files, structured in one workspace.',
    twitterCard: 'summary_large_image',
    twitterTitle: page.title,
    twitterDescription: page.description,
    twitterImage: image,
    twitterImageAlt: 'MatterDraft Studio legal document workspace',
  })

  useHead({
    link: [
      { key: 'canonical', rel: 'canonical', href: canonical },
      ...(page.markdownPath ? [{
        key: 'markdown-alternate', rel: 'alternate' as const, type: 'text/markdown',
        href: new URL(page.markdownPath, origin).href,
      }] : []),
    ],
  })
}
