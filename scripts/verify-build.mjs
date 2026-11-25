import assert from 'node:assert/strict'
import { readFile, readdir, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { createHash } from 'node:crypto'
import { NO_INDEX } from './discovery.mjs'
import { copyPlaceholderPattern } from './generate-content.mjs'
import { loadSiteConfig } from './site-config.mjs'

const root = dirname(dirname(fileURLToPath(import.meta.url))),
  dist = join(root, 'dist')
const settings = loadSiteConfig({ projectRoot: root })
const { homepage, faq, legalDocuments, publisher, socialImage } = settings.facts
const pages = ['', ...legalDocuments.map(({ slug }) => slug)]
const pageReports = []
for (const route of pages) {
  const html = await readFile(join(dist, route, 'index.html'), 'utf8')
  assert.doesNotMatch(html, copyPlaceholderPattern, `Publication placeholder on /${route}`)
  const canonical = new URL(route ? `/${route}` : '/', settings.siteUrl).href
  assert(
    html.includes(`rel="canonical" href="${canonical}"`) ||
      html.includes(`href="${canonical}" rel="canonical"`),
    `Missing canonical on /${route}`,
  )
  assert.equal([...html.matchAll(/<h1(?:\s|>)/g)].length, 1, `Expected one H1 on /${route}`)
  assert(
    /<meta\s+name="description"\s+content="[^\"]+"/.test(html),
    `Missing description on /${route}`,
  )
  assert(html.includes('property="og:image"'), `Missing social image on /${route}`)
  const robots = [...html.matchAll(/<meta name="robots" content="([^"]+)">/g)].map(
    (match) => match[1],
  )
  const expectedRobots = settings.indexable ? 'index, follow, max-image-preview:large' : NO_INDEX
  assert.deepEqual(robots, [expectedRobots], `Incorrect robots metadata on /${route}`)
  if (route) {
    assert.match(html, /<strong>Effective date:<\/strong> \d{1,2} \w+ \d{4}/)
    assert.match(html, /<strong>Last updated:<\/strong> \d{1,2} \w+ \d{4}/)
    assert(html.includes('Envsoft Solutions LLP') && html.includes('Neha Sharma (CEO)'))
    assert(html.includes('mailto:hello@matterdraft.legal'))
    assert.doesNotMatch(html, /Review draft|Publication notes/i)
  }
  assert(
    html.includes(new URL(socialImage.path, settings.siteUrl).href),
    `Missing absolute social image on /${route}`,
  )
  assert(!html.includes('data:font/'), 'Embedded font data should be externalized')
  assert(!html.includes('fonts.googleapis.com'), 'Font must be self-hosted')
  const ids = [...html.matchAll(/\sid="([^\"]+)"/g)].map((m) => m[1])
  assert.equal(ids.length, new Set(ids).size, `Duplicate IDs on /${route}`)
  const cspMeta = html.match(/<meta http-equiv="Content-Security-Policy" content="([^\"]+)">/i)
  assert(cspMeta, `Build-specific CSP is missing from /${route}`)
  assert(
    html.indexOf(cspMeta[0]) < html.indexOf('<script'),
    `CSP must precede scripts on /${route}`,
  )
  for (const script of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (!/\bsrc\s*=/.test(script[1]) && script[2]) {
      const hash = `sha256-${createHash('sha256').update(script[2]).digest('base64')}`
      assert(cspMeta[1].includes(hash), `Inline script hash missing from CSP on /${route}`)
    }
  }
  pageReports.push({
    route: `/${route}`,
    htmlBytes: Buffer.byteLength(html),
    gzipBytes: gzipSync(html).length,
  })
}
const home = await readFile(join(dist, 'index.html'), 'utf8')
for (const id of [
  'early-access',
  'product',
  'matter-workspace',
  'pdf-engine',
  'ocr',
  'production-tools',
  'document-generation',
  'automation',
  'volumes',
  'validation',
  'local-processing',
  'export',
  'workflow',
  'product-overview',
])
  assert(home.includes(`<section id="${id}"`), `Missing landing page section: ${id}`)

const header = home.match(/<header class="studio-header"[\s\S]*?<\/header>/)?.[0]
assert.match(header ?? '', /class="[^"]*\bheader-access-hidden\b[^"]*" href="#early-access"/)
for (const href of [
  '#product',
  '#pdf-engine',
  '#workflow',
  '#automation',
  '#local-processing',
  '#faq',
])
  assert(header.includes(`href="${href}"`), `Missing toolbar link to ${href}`)
assert.match(home, /<h1 id="hero-title">From case papers to an indexed court bundle<\/h1>/)
const hero = home.match(/<section class="studio-hero"[\s\S]*?<\/section>/)?.[0]
assert(hero?.includes('Desktop document preparation for advocates and chambers'))
assert(hero?.includes('rebuild to update the page numbers, linked index and bookmarks together'))
assert(hero.includes('href="#early-access"') && hero.includes('href="#workflow"'))
assert(hero.includes('one month free after launch'))
const footer = home.match(/<footer class="studio-footer"[\s\S]*?<\/footer>/)?.[0]
for (const section of [hero, footer]) {
  assert(section?.includes(`href="${settings.facts.advocateSurveyUrl}"`))
  assert(section.includes('Advocate survey on Google Forms'))
}
const shortcuts = home.match(/<nav class="bundle-shortcuts"[\s\S]*?<\/nav>/)?.[0]
assert.deepEqual(
  [...(shortcuts?.matchAll(/<a href="(#[^"]+)"/g) ?? [])].map((match) => match[1]),
  [
    '#matter-workspace',
    '#ocr',
    '#matter-workspace',
    '#collation',
    '#automation',
    '#automation',
    '#validation',
    '#export',
  ],
)
const signup = home.match(/<section id="early-access"[\s\S]*?<\/section>/)?.[0]
assert(signup?.includes('<h3>One month free after launch</h3>'))
const closing = home.match(/<section id="product-overview"[\s\S]*?<\/section>/)?.[0]
assert(closing?.includes('href="#early-access"'))
assert(home.indexOf('id="workspace-preview"') < home.indexOf('id="early-access"'))
assert(home.indexOf('id="early-access"') < home.indexOf('id="workflow"'))
assert(home.indexOf('id="workflow"') < home.indexOf('id="matter-workspace"'))
const collation = home.match(/<section id="automation"[\s\S]*?<\/section>/)?.[0]
assert(collation?.includes('Agreement.pdf starts on page <strong>43</strong>'))
assert(
  home.includes(`<title>${homepage.title}</title>`),
  'Homepage title does not match the site configuration',
)
assert.equal(
  home.includes('type="text/markdown"'),
  settings.indexable,
  'Unexpected Markdown alternate on homepage',
)
for (const required of ['196', 'Fictional', 'matterdraft-structured-data'])
  assert(home.includes(required), `Missing server-rendered content: ${required}`)
assert(
  home.includes('We do not upload your documents, OCR text or finished bundles to our servers.'),
)
for (const required of [
  'Early access registration',
  'one month free after launch',
  settings.earlyAccessEnabled ? 'Join early access' : 'Registration isn’t open yet',
])
  assert(home.includes(required), `Missing early access content: ${required}`)
assert(
  !home.includes('Request a demo') && !home.includes('data-demo') && !home.includes('demo-dialog'),
  'Demo request UI must be absent',
)
const structured = [...home.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].find((m) =>
  m[1].includes('application/ld+json'),
)
assert(structured, 'JSON-LD missing')
const schema = JSON.parse(structured[2])
const software = schema['@graph'].find((node) => node['@type'] === 'SoftwareApplication')
const webPage = schema['@graph'].find((node) => node['@type'] === 'WebPage')
const website = schema['@graph'].find((node) => node['@type'] === 'WebSite')
const publisherNode = schema['@graph'].find((node) => node['@type'] === 'Organization')
assert(publisherNode?.['@id'], 'Publisher structured data is missing')
assert.equal(publisherNode.name, publisher.name)
assert.equal(publisherNode.url, publisher.url)
assert.equal(software?.publisher?.['@id'], publisherNode['@id'])
assert.equal(website?.publisher?.['@id'], publisherNode['@id'])
assert.equal(
  software?.creativeWorkStatus,
  settings.facts.status,
  'Software development status missing',
)
assert.equal(
  webPage?.mainEntity['@id'],
  software['@id'],
  'Homepage structured data must link to the software',
)
assert(
  !schema['@graph'].some((n) => n.offers || n.aggregateRating),
  'No invented pricing or ratings',
)
for (const file of [
  'robots.txt',
  'sitemap.xml',
  'llms.txt',
  'llms-full.txt',
  'index.md',
  'favicon.svg',
  'favicon-32.png',
  'apple-touch-icon.png',
  'site.webmanifest',
  'og/matterdraft-social.jpg',
  'fonts/plus-jakarta-sans-latin-variable.woff2',
  'fonts/manrope-latin-variable.woff2',
  'fonts/jetbrains-mono-medium.woff2',
  'brand/studio-wordmark-light.svg',
  'brand/studio-wordmark-dark.svg',
  '_headers',
  '404.html',
])
  assert((await stat(join(dist, file))).size > 0, `Missing ${file}`)
const sitemap = await readFile(join(dist, 'sitemap.xml'), 'utf8')
assert(sitemap.includes('<urlset'), 'Invalid sitemap')
const canonical = new URL(homepage.path, settings.siteUrl).href
const sitemapEntries = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])
const publicPages = pages.map((route) => new URL('/' + route, settings.siteUrl).href)
assert.deepEqual(
  sitemapEntries,
  settings.indexable ? publicPages : [],
  'Sitemap includes unexpected URLs',
)
const robots = await readFile(join(dist, 'robots.txt'), 'utf8')
assert.equal(
  robots.includes(`Sitemap: ${new URL('/sitemap.xml', settings.siteUrl).href}`),
  settings.indexable,
)
const llms = await readFile(join(dist, 'llms.txt'), 'utf8')
assert(llms.startsWith('# MatterDraft'), 'llms.txt H1 missing')
assert(llms.includes('/index.md'), 'Markdown product description not discoverable')
const product = await readFile(join(dist, homepage.markdownPath.slice(1)), 'utf8')
const faqHtml = home.match(/<section id="faq"[\s\S]*?<\/section>/)?.[0]
assert(faqHtml, 'FAQ must be rendered in the initial HTML')
for (const { question, answer, link } of faq) {
  assert(faqHtml.includes(question) && faqHtml.includes(answer), `Missing visible FAQ: ${question}`)
  assert(
    product.includes(question) && product.includes(answer),
    `Missing Markdown FAQ: ${question}`,
  )
  if (link) {
    assert(faqHtml.includes(`href="${link.path}"`), `Missing visible FAQ link: ${link.path}`)
    assert(
      product.includes(new URL(link.path, canonical).href),
      `Missing Markdown FAQ link: ${link.path}`,
    )
    const { hash } = new URL(link.path, canonical)
    if (hash) assert(home.includes(`id="${hash.slice(1)}"`), `Missing FAQ link target: ${hash}`)
  }
}
for (const anchor of [
  ...settings.facts.capabilities.map((capability) => capability.anchor),
  'early-access',
]) {
  assert(home.includes(`id="${anchor}"`), `Markdown points to a missing homepage anchor: ${anchor}`)
  assert(
    product.includes(canonical + '#' + anchor),
    `Markdown is missing a homepage link: ${anchor}`,
  )
}
const assetNames = (await readdir(join(dist, '_nuxt'))).filter((name) => /\.(js|css)$/.test(name))
let jsBytes = 0,
  jsGzip = 0,
  cssBytes = 0,
  cssGzip = 0
for (const name of assetNames) {
  const data = await readFile(join(dist, '_nuxt', name))
  if (name.endsWith('.js')) {
    jsBytes += data.length
    jsGzip += gzipSync(data).length
  } else {
    cssBytes += data.length
    cssGzip += gzipSync(data).length
  }
}
const landingFonts = ['manrope-latin-variable.woff2', 'jetbrains-mono-medium.woff2']
const fontBytes = (
  await Promise.all(landingFonts.map((file) => stat(join(dist, 'fonts', file))))
).reduce((sum, file) => sum + file.size, 0)
assert(jsGzip < 250 * 1024, `All-route JS gzip budget exceeded: ${jsGzip}`)
assert(cssGzip < 48 * 1024, `CSS gzip budget exceeded: ${cssGzip}`)
assert(fontBytes < 180 * 1024, `Font budget exceeded: ${fontBytes}`)
const report = {
  checkedAt: new Date().toISOString(),
  result: 'passed',
  pages: pageReports,
  assets: {
    allRoutesJsBytes: jsBytes,
    allRoutesJsGzipBytes: jsGzip,
    allCssBytes: cssBytes,
    allCssGzipBytes: cssGzip,
    fontBytes,
  },
  note: 'All-route totals include policy chunks; these are size checks, not a Lighthouse score or a real-user loading-time guarantee.',
}
console.log(JSON.stringify(report, null, 2))
