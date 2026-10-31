import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile, rm, access } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  canonicalUrl, resolveSiteConfig, validateSiteOrigin, PROJECT_ROOT,
} from '../scripts/site-config.mjs'
import {
  escapeXml,
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

test('indexing defaults to on and preview flags remain explicit', () => {
  assert.equal(resolveSiteConfig({}).indexable, true)
  assert.equal(resolveSiteConfig({ INDEXABLE: 'false' }).indexable, false)
  assert.throws(() => resolveSiteConfig({ INDEXABLE: 'perhaps' }), /true or false/)
  assert.throws(() => resolveSiteConfig({
    INDEXABLE: 'false', NUXT_PUBLIC_INDEXABLE: 'true',
  }), /must agree/)
})

test('early access opens only when both private webhook settings are present', () => {
  assert.equal(resolveSiteConfig({}).earlyAccessEnabled, false)
  assert.equal(resolveSiteConfig({ EARLY_ACCESS_GOOGLE_SHEETS_URL: 'https://script.google.com/macros/s/id/exec' }).earlyAccessEnabled, false)
  assert.equal(resolveSiteConfig({ EARLY_ACCESS_GOOGLE_SHEETS_URL: 'https://script.google.com/macros/s/id/exec', EARLY_ACCESS_GOOGLE_SHEETS_SECRET: 'secret' }).earlyAccessEnabled, true)
})

test('preview builds advertise no sitemap and contain no indexable sitemap URLs', () => {
  const config = resolveSiteConfig({
    NUXT_PUBLIC_SITE_URL: 'https://preview.example.com',
    INDEXABLE: 'false',
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

test('sitemap paths use the configured origin and escape XML', () => {
  const config = resolveSiteConfig({ NUXT_PUBLIC_SITE_URL: 'https://example.com' })
  assert.match(renderSitemap(config, ['/a&b']), /\/a&amp;b<\/loc>/)
  assert.equal(escapeXml('&<>"\''), '&amp;&lt;&gt;&quot;&apos;')
  assert.doesNotMatch(renderSitemap(config), /lastmod|changefreq|priority/)
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

test('generation removes stale policy Markdown exports', async (t) => {
  const projectRoot = await createFixture(t)
  await mkdir(join(projectRoot, 'public/legal'), { recursive: true })
  await writeFile(join(projectRoot, 'public/legal/privacy.md'), 'Old published copy.')
  await writeFile(join(projectRoot, 'public/legal/unrelated.md'), 'Keep this file.')
  await generateContent({ projectRoot, env: {} })
  await assert.rejects(access(join(projectRoot, 'public/legal/privacy.md')))
  assert.equal(await readFile(join(projectRoot, 'public/legal/unrelated.md'), 'utf8'), 'Keep this file.')
})
