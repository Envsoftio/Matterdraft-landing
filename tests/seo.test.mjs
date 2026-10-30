import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile, rm, access } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  canonicalUrl, resolveSiteConfig, validateSiteOrigin, PROJECT_ROOT,
} from '../scripts/site-config.mjs'
import {
  assertLegalPublicationReady, escapeXml, findUnresolvedBusinessFields,
  generateContent, prepareLegalMarkdown, renderLlmsIndex, renderRobots, renderSitemap,
} from '../scripts/generate-content.mjs'

test('site origins normalize once and reject deployment mistakes', () => {
  assert.equal(validateSiteOrigin('HTTPS://EXAMPLE.COM:443/'), 'https://example.com')
  assert.equal(validateSiteOrigin('https://preview.example.com:8443'), 'https://preview.example.com:8443')
  for (const input of [
    '', 'example.com', '//example.com', 'http://example.com',
    'https://user:password@example.com', 'https://example.com/page',
    'https://example.com/page/..', 'https://example.com/?preview=1',
    'https://example.com/#section', 'https://example.com\\page',
  ]) {
    assert.throws(() => validateSiteOrigin(input), /HTTPS origin/, input)
  }
})

test('canonical URLs retain the configured origin and reject ambiguous paths', () => {
  assert.equal(canonicalUrl('/', 'https://example.com'), 'https://example.com/')
  assert.equal(canonicalUrl('/privacy', 'https://example.com/'), 'https://example.com/privacy')
  for (const path of ['privacy', '//other.example/privacy', 'https://other.example/', '/a?b=1', '/a#b', '/\\other']) {
    assert.throws(() => canonicalUrl(path, 'https://example.com'), /Canonical paths/)
  }
})

test('false remains false and conflicting Nuxt public flags fail explicitly', () => {
  const config = resolveSiteConfig({ INDEXABLE: 'false', LEGAL_PUBLISHED: 'false' })
  assert.equal(config.indexable, false)
  assert.equal(config.legalPublished, false)
  assert.throws(() => resolveSiteConfig({ INDEXABLE: 'perhaps' }), /true or false/)
  assert.throws(() => resolveSiteConfig({
    LEGAL_PUBLISHED: 'false', NUXT_PUBLIC_LEGAL_PUBLISHED: 'true',
  }), /must agree/)
})

test('preview builds advertise no sitemap and contain no indexable sitemap URLs', () => {
  const config = resolveSiteConfig({
    NUXT_PUBLIC_SITE_URL: 'https://preview.example.com',
    INDEXABLE: 'false',
    LEGAL_PUBLISHED: 'true',
  })
  assert.equal(renderRobots(config), 'User-agent: *\nDisallow: /\n')
  assert.doesNotMatch(renderSitemap(config), /<url>/)
})

test('draft policies stay out of discovery while remaining crawlable for noindex', () => {
  const config = resolveSiteConfig({ NUXT_PUBLIC_SITE_URL: 'https://example.com' })
  const robots = renderRobots(config)
  assert.match(robots, /Disallow: \/api\n/)
  assert.doesNotMatch(robots, /Disallow: \/(?:privacy|terms|refund-policy)/)
  assert.match(robots, /Sitemap: https:\/\/example\.com\/sitemap\.xml/)
  assert.equal((renderSitemap(config).match(/<url>/g) || []).length, 1)
  assert.doesNotMatch(renderSitemap(config), /\/(?:privacy|terms|refund-policy)</)
  const llms = renderLlmsIndex(config)
  assert.match(llms, /review drafts/)
  assert.match(llms, /\]\(https:\/\/example\.com\/index\.md\)/)
  assert.match(llms, /\]\(https:\/\/example\.com\/llms-full\.txt\)/)
  assert.doesNotMatch(llms, /\/legal\/.*\.md/)
  assert.doesNotMatch(llms, /matterdraft\.legal/)
})

test('published policy discovery uses the same origin and correctly escapes XML', () => {
  const config = resolveSiteConfig({
    NUXT_PUBLIC_SITE_URL: 'https://example.com', LEGAL_PUBLISHED: 'true',
  })
  const sitemap = renderSitemap(config)
  assert.equal((sitemap.match(/<url>/g) || []).length, 4)
  for (const slug of ['privacy', 'terms', 'refund-policy']) {
    assert.ok(sitemap.includes('<loc>https://example.com/' + slug + '</loc>'))
    assert.ok(renderLlmsIndex(config).includes('https://example.com/legal/' + slug + '.md'))
  }
  assert.match(renderSitemap(config, ['/a&b']), /\/a&amp;b<\/loc>/)
  assert.equal(escapeXml('&<>"\''), '&amp;&lt;&gt;&quot;&apos;')
  assert.doesNotMatch(sitemap, /lastmod|changefreq|priority/)
})

test('publication guard recognizes the actual draft field styles', () => {
  const markdown = [
    '[LEGAL_OPERATOR_NAME]',
    '[EFFECTIVE_DATE]',
    '[APP_DATA_DISCLOSURE — identify versions, files and recipients.]',
    '[GRIEVANCE_EMAIL_AND_PHONE]',
    '[Privacy Policy](privacy.md)',
  ].join('\n')
  assert.deepEqual(findUnresolvedBusinessFields(markdown), [
    'APP_DATA_DISCLOSURE', 'EFFECTIVE_DATE', 'GRIEVANCE_EMAIL_AND_PHONE', 'LEGAL_OPERATOR_NAME',
  ])
  const documents = [{ slug: 'privacy', markdown }]
  assert.doesNotThrow(() => assertLegalPublicationReady(documents, false))
  assert.throws(() => assertLegalPublicationReady(documents, true), /privacy:.*LEGAL_OPERATOR_NAME/s)
})

test('legal preparation retains review status but removes the duplicated title and appendix', () => {
  const prepared = prepareLegalMarkdown([
    '# MatterDraft Studio — Privacy Policy',
    '',
    '> Review draft prepared for confirmation.',
    '',
    '## 1. Scope',
    'Policy content.',
    '',
    '---',
    '',
    '## Publication notes — remove this section before publishing',
    'Internal adoption instructions.',
  ].join('\n'))
  assert.match(prepared.markdown, /^# MatterDraft Studio/)
  assert.doesNotMatch(prepared.body, /^# /m)
  assert.match(prepared.body, /Review draft/)
  assert.match(prepared.body, /Policy content/)
  assert.doesNotMatch(prepared.markdown, /Publication notes|Internal adoption|---/)
})

async function createFixture(t, unresolved = false) {
  const root = await mkdtemp(join(tmpdir(), 'matterdraft-seo-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  await mkdir(join(root, 'content/legal'), { recursive: true })
  const facts = await readFile(join(PROJECT_ROOT, 'content/site.json'), 'utf8')
  await writeFile(join(root, 'content/site.json'), facts)
  for (const slug of ['privacy', 'terms', 'refund-policy']) {
    await writeFile(join(root, 'content/legal', slug + '.md'), [
      '# MatterDraft Studio — ' + slug,
      '',
      '> Review draft for the website.',
      '',
      unresolved ? 'Operator: [LEGAL_OPERATOR_NAME]' : 'Operator: Example Operator',
      '',
      '## 1. Scope',
      '[Terms and Conditions](MatterDraft-Terms-and-Conditions.md).',
      '',
      '---',
      '',
      '## Publication notes — remove this section before publishing',
      'Internal publication instructions.',
    ].join('\n'))
  }
  return root
}

test('generation prepares HTML modules, preserves sources and does not export raw drafts', async (t) => {
  const projectRoot = await createFixture(t, true)
  const sourcePath = join(projectRoot, 'content/legal/privacy.md')
  const before = await readFile(sourcePath, 'utf8')
  const result = await generateContent({ projectRoot, env: {} })
  assert.equal(result.written.length, 8)
  const module = await readFile(join(projectRoot, 'app/data/legal/privacy.ts'), 'utf8')
  const data = JSON.parse(module.slice(module.indexOf('export default ') + 'export default '.length))
  assert.equal(data.slug, 'privacy')
  assert.match(data.description, /^Review draft\./)
  assert.match(data.html, /Review draft/)
  assert.match(data.html, /href="\/terms"/)
  assert.doesNotMatch(data.html, /<h1|Publication notes|Internal publication/)
  assert.equal(await readFile(sourcePath, 'utf8'), before)
  await assert.rejects(access(join(projectRoot, 'public/legal/privacy.md')))
  assert.doesNotMatch(await readFile(join(projectRoot, 'public/llms-full.txt'), 'utf8'), /LEGAL_OPERATOR_NAME/)
})

test('a failed publication guard leaves previously generated files unchanged', async (t) => {
  const projectRoot = await createFixture(t, true)
  await generateContent({ projectRoot, env: {} })
  const sitemapPath = join(projectRoot, 'public/sitemap.xml')
  const before = await readFile(sitemapPath, 'utf8')
  await assert.rejects(generateContent({
    projectRoot, env: { LEGAL_PUBLISHED: 'true' },
  }), /cannot publish unresolved business fields/)
  assert.equal(await readFile(sitemapPath, 'utf8'), before)
})

test('withdrawing publication removes only the generated legal Markdown copies', async (t) => {
  const projectRoot = await createFixture(t)
  const env = { NUXT_PUBLIC_SITE_URL: 'https://example.com', LEGAL_PUBLISHED: 'true' }
  await generateContent({ projectRoot, env })
  const published = await readFile(join(projectRoot, 'public/legal/privacy.md'), 'utf8')
  assert.match(published, /https:\/\/example\.com\/legal\/terms\.md/)
  assert.doesNotMatch(published, /Publication notes/)
  await writeFile(join(projectRoot, 'public/legal/unrelated.md'), 'Keep this file.')
  await generateContent({ projectRoot, env: { ...env, LEGAL_PUBLISHED: 'false' } })
  await assert.rejects(access(join(projectRoot, 'public/legal/privacy.md')))
  assert.equal(await readFile(join(projectRoot, 'public/legal/unrelated.md'), 'utf8'), 'Keep this file.')
})
