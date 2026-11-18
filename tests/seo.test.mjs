import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile, rm, access } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { discoveryHeaders, NO_INDEX_FOLLOW, NO_INDEX, privateAreas } from '../scripts/discovery.mjs'
import {
  canonicalUrl,
  resolveSiteConfig,
  validateSiteOrigin,
  PROJECT_ROOT,
} from '../scripts/site-config.mjs'
import {
  escapeXml,
  generateContent,
  prepareLegalMarkdown,
  renderLlmsIndex,
  renderRobots,
  renderSitemap,
} from '../scripts/generate-content.mjs'

test('site origins normalize once and reject deployment mistakes', () => {
  assert.equal(validateSiteOrigin('HTTPS://EXAMPLE.COM:443/'), 'https://example.com')
  assert.equal(
    validateSiteOrigin('https://preview.example.com:8443'),
    'https://preview.example.com:8443',
  )
  for (const input of [
    '',
    'example.com',
    '//example.com',
    'http://example.com',
    'https://user:password@example.com',
    'https://example.com/page',
    'https://example.com/page/..',
    'https://example.com/?preview=1',
    'https://example.com/#section',
    'https://example.com\\page',
  ]) {
    assert.throws(() => validateSiteOrigin(input), /HTTPS origin/, input)
  }
})

test('canonical URLs retain the configured origin and reject ambiguous paths', () => {
  assert.equal(canonicalUrl('/', 'https://example.com'), 'https://example.com/')
  assert.equal(canonicalUrl('/privacy', 'https://example.com/'), 'https://example.com/privacy')
  for (const path of [
    'privacy',
    '//other.example/privacy',
    'https://other.example/',
    '/a?b=1',
    '/a#b',
    '/\\other',
  ]) {
    assert.throws(() => canonicalUrl(path, 'https://example.com'), /Canonical paths/)
  }
})

test('indexing defaults to on and preview flags remain explicit', () => {
  assert.equal(resolveSiteConfig({}).indexable, true)
  assert.equal(resolveSiteConfig({ CONTEXT: 'deploy-preview' }).indexable, false)
  assert.equal(
    resolveSiteConfig({ CONTEXT: 'branch-deploy', NUXT_PUBLIC_INDEXABLE: 'true' }).indexable,
    true,
  )
  assert.equal(resolveSiteConfig({ INDEXABLE: 'false' }).indexable, false)
  assert.throws(() => resolveSiteConfig({ INDEXABLE: 'perhaps' }), /true or false/)
  assert.throws(
    () =>
      resolveSiteConfig({
        INDEXABLE: 'false',
        NUXT_PUBLIC_INDEXABLE: 'true',
      }),
    /must agree/,
  )
})

test('early access opens only with a valid webhook destination and shared secret', () => {
  assert.equal(resolveSiteConfig({}).earlyAccessEnabled, false)
  assert.equal(
    resolveSiteConfig({
      EARLY_ACCESS_GOOGLE_SHEETS_URL: 'https://script.google.com/macros/s/id/exec',
    }).earlyAccessEnabled,
    false,
  )
  const settings = {
    EARLY_ACCESS_GOOGLE_SHEETS_URL: 'https://script.google.com/macros/s/id/exec',
    EARLY_ACCESS_GOOGLE_SHEETS_SECRET: 'x'.repeat(32),
  }
  assert.equal(resolveSiteConfig(settings).earlyAccessEnabled, true)
  assert.equal(
    resolveSiteConfig({ ...settings, EARLY_ACCESS_GOOGLE_SHEETS_SECRET: 'short' })
      .earlyAccessEnabled,
    false,
  )
  assert.equal(
    resolveSiteConfig({ ...settings, EARLY_ACCESS_GOOGLE_SHEETS_URL: 'https://example.test/' })
      .earlyAccessEnabled,
    false,
  )
})

test('preview builds advertise no sitemap and contain no indexable sitemap URLs', () => {
  const config = resolveSiteConfig({
    NUXT_PUBLIC_SITE_URL: 'https://preview.example.com',
    INDEXABLE: 'false',
  })
  assert.equal(renderRobots(config), 'User-agent: *\nDisallow: /\n')
  assert.doesNotMatch(renderSitemap(config), /<url>/)
})

test('published policies appear in discovery without listing private routes', () => {
  const config = resolveSiteConfig({ NUXT_PUBLIC_SITE_URL: 'https://example.com' })
  const robots = renderRobots(config)
  for (const group of ['User-agent: *', 'User-agent: OAI-SearchBot']) {
    const rules = robots.split('\n\n').find((section) => section.startsWith(group + '\n'))
    assert.ok(rules, group)
    assert.ok(rules.includes('Allow: /\n'), group)
    for (const path of privateAreas) {
      assert.ok(rules.split('\n').includes(`Disallow: ${path}/`), path)
      assert.ok(rules.split('\n').includes(`Disallow: ${path}$`), path)
    }
  }
  assert.doesNotMatch(robots, /Disallow: \/(?:privacy|terms|refund-policy)/)
  assert.match(robots, /Sitemap: https:\/\/example\.com\/sitemap\.xml/)
  assert.equal((renderSitemap(config).match(/<url>/g) || []).length, 4)
  for (const path of ['/privacy', '/terms', '/refund-policy']) {
    assert.ok(renderSitemap(config).includes(`<loc>https://example.com${path}</loc>`))
    assert.ok(renderLlmsIndex(config).includes(`(https://example.com${path})`))
  }
  const llms = renderLlmsIndex(config)
  assert.doesNotMatch(llms, /review drafts/)
  assert.match(llms, /\]\(https:\/\/example\.com\/index\.md\)/)
  assert.match(llms, /\]\(https:\/\/example\.com\/llms-full\.txt\)/)
  assert.match(llms, /\]\(https:\/\/example\.com\/#early-access\)/)
  assert.doesNotMatch(llms, /\/legal\/.*\.md/)
  assert.doesNotMatch(llms, /matterdraft\.legal/)
})

test('discovery headers scope public links, private pages and preview indexing', () => {
  const config = resolveSiteConfig({ NUXT_PUBLIC_SITE_URL: 'https://example.com' })
  const headers = discoveryHeaders(config)
  assert.match(headers['/'].Link, /<\/index\.md>.*<\/llms\.txt>/)
  assert.equal(headers['/index.md'].Link, '<https://example.com/>; rel="canonical"')
  assert.equal(headers['/index.md']['Content-Type'], 'text/markdown; charset=utf-8')
  assert.equal(headers['/llms-full.txt'].Link, headers['/index.md'].Link)
  assert.equal(headers['/llms.txt']['X-Robots-Tag'], NO_INDEX_FOLLOW)
  assert.equal(headers['/privacy'], undefined)
  for (const path of [
    '/sign-in',
    '/reset-password',
    '/verify-email',
    '/consent',
    '/maintenance.html',
    ...privateAreas,
  ]) {
    assert.equal(headers[path]['X-Robots-Tag'], NO_INDEX, path)
    assert.equal(headers[path].Link, undefined, path)
  }
  for (const path of privateAreas) assert.equal(headers[`${path}/**`]['X-Robots-Tag'], NO_INDEX)
  const preview = discoveryHeaders({ ...config, indexable: false })
  assert.equal(preview['/'], undefined)
  assert.equal(preview['/index.md'].Link, undefined)
  assert.equal(preview['/**']['X-Robots-Tag'], NO_INDEX)
})

test('sitemap paths use the configured origin and escape XML', () => {
  const config = resolveSiteConfig({ NUXT_PUBLIC_SITE_URL: 'https://example.com' })
  assert.match(renderSitemap(config, ['/a&b']), /\/a&amp;b<\/loc>/)
  assert.equal(escapeXml('&<>"\''), '&amp;&lt;&gt;&quot;&apos;')
  assert.doesNotMatch(renderSitemap(config), /lastmod|changefreq|priority/)
})

test('legal preparation removes the duplicated title and rejects unpublished material', () => {
  const heading = '# MatterDraft Studio — Privacy Policy\n\n'
  assert.equal(
    prepareLegalMarkdown(heading + '## Scope\nPolicy content.'),
    '## Scope\nPolicy content.\n',
  )
  for (const text of [
    '[UNRESOLVED_FIELD]',
    '[Insert company address]',
    'Lorem ipsum dolor sit amet.',
    'Contact details are TBD.',
    '> **Review draft.**',
    '## Publication notes',
  ]) {
    assert.throws(() => prepareLegalMarkdown(heading + text), /before publishing/)
  }
})

async function createFixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'matterdraft-seo-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  await mkdir(join(root, 'content/legal'), { recursive: true })
  const facts = await readFile(join(PROJECT_ROOT, 'content/site.json'), 'utf8')
  await writeFile(join(root, 'content/site.json'), facts)
  for (const slug of ['privacy', 'terms', 'refund-policy']) {
    await writeFile(
      join(root, 'content/legal', slug + '.md'),
      [
        '# MatterDraft Studio — ' + slug,
        '',
        'Operator: Example Operator',
        '',
        '## 1. Scope',
        '[Terms and Conditions](/terms).',
      ].join('\n'),
    )
  }
  return root
}

test('generation prepares policy HTML and keeps the Markdown source intact', async (t) => {
  const projectRoot = await createFixture(t)
  const sourcePath = join(projectRoot, 'content/legal/privacy.md')
  const before = await readFile(sourcePath, 'utf8')
  const result = await generateContent({ projectRoot, env: {} })
  assert.equal(result.written.length, 8)
  const module = await readFile(join(projectRoot, 'app/data/legal/privacy.ts'), 'utf8')
  const data = JSON.parse(
    module.slice(module.indexOf('export default ') + 'export default '.length),
  )
  assert.equal(data.slug, 'privacy')
  assert.doesNotMatch(data.description, /Review draft/)
  assert.match(data.html, /Example Operator/)
  assert.match(data.html, /href="\/terms"/)
  assert.doesNotMatch(data.html, /<h1|Publication notes|Internal publication/)
  assert.equal(await readFile(sourcePath, 'utf8'), before)
  await assert.rejects(access(join(projectRoot, 'public/legal/privacy.md')))
  assert.match(
    await readFile(join(projectRoot, 'public/llms-full.txt'), 'utf8'),
    /\(https:\/\/matterdraft\.legal\/privacy\)/,
  )
})

test('generation removes stale policy Markdown exports', async (t) => {
  const projectRoot = await createFixture(t)
  await mkdir(join(projectRoot, 'public/legal'), { recursive: true })
  await writeFile(join(projectRoot, 'public/legal/privacy.md'), 'Old published copy.')
  await writeFile(join(projectRoot, 'public/legal/unrelated.md'), 'Keep this file.')
  await generateContent({ projectRoot, env: {} })
  await assert.rejects(access(join(projectRoot, 'public/legal/privacy.md')))
  assert.equal(
    await readFile(join(projectRoot, 'public/legal/unrelated.md'), 'utf8'),
    'Keep this file.',
  )
})
