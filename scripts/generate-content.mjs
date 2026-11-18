import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { privateAreas } from './discovery.mjs'
import { canonicalUrl, loadSiteConfig, PROJECT_ROOT } from './site-config.mjs'

const LEGAL_SLUGS = ['privacy', 'terms', 'refund-policy']
export function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
  })[character])
}

export function prepareLegalMarkdown(markdown) {
  const normalized = markdown.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').trim()
  const heading = normalized.match(/^#[ \t]+([^\n]+)\n*/)
  if (!heading) throw new Error('Every legal source must start with one level-one title.')
  if (/\[[A-Z][A-Z0-9]*_[A-Z0-9_]+\b/.test(normalized) || /^#{1,6}\s+Publication notes\b|^>\s+\*{0,2}Review draft\b/im.test(normalized)) {
    throw new Error('Remove placeholders and draft notes before publishing a legal policy.')
  }
  return normalized.slice(heading[0].length).trim() + '\n'
}

export function renderRobots(config) {
  if (!config.indexable) return 'User-agent: *\nDisallow: /\n'
  const rules = [
    'Allow: /',
    ...privateAreas.flatMap((path) => [
      'Disallow: ' + path + '$',
      'Disallow: ' + path + '/',
      'Disallow: ' + path + '?',
    ]),
  ]
  return [
    'User-agent: *', ...rules, '',
    'User-agent: OAI-SearchBot', ...rules, '',
    'Sitemap: ' + canonicalUrl('/sitemap.xml', config.siteUrl),
    '',
  ].join('\n')
}

export function renderSitemap(config, paths = [
  config.facts.homepage.path, ...config.facts.legalDocuments.map(({ slug }) => '/' + slug),
]) {
  const entries = config.indexable
    ? [...new Set(paths)].map((path) =>
      '  <url><loc>' + escapeXml(canonicalUrl(path, config.siteUrl)) + '</loc></url>')
    : []
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</urlset>',
    '',
  ].join('\n')
}

export function renderProductMarkdown(config) {
  const { facts, siteUrl } = config
  const homepage = canonicalUrl(facts.homepage.path, siteUrl)
  const lines = [
    '# ' + facts.name,
    '',
    '> ' + facts.summary,
    '',
    '[MatterDraft Studio website](' + homepage + ')',
    '',
    facts.status + ' for ' + facts.platforms.join(' and ') + '.',
    '',
    '## Document privacy',
    '',
    'Case files, working copies, recognised text and finished bundles stay on your device. ' +
    'MatterDraft does not upload these files or their contents to its servers. ' +
    '[Read the Privacy Policy](' + canonicalUrl('/privacy', siteUrl) + ') for how the website handles account and support information.',
    '',
    '## Product scope',
    '',
    ...facts.qualifications.map((qualification) => '- ' + qualification),
    '',
    '## Intended workflows',
    '',
    ...facts.capabilities.flatMap(({ title, description, anchor }) => [
      '### ' + title, '', description, '',
      '[See this workflow on the website](' + homepage + '#' + anchor + ')', '',
    ]),
    '## Availability',
    '',
    'The [early access section](' + homepage + '#early-access) shows whether registration is open. ' +
    'Early access signups receive launch updates and are offered one month free after launch.',
    '',
    '## Policies',
    '',
    ...facts.legalDocuments.map(({ slug, title }) => '- [' + title + '](' + canonicalUrl('/' + slug, siteUrl) + ')'),
  ]
  return lines.join('\n').trimEnd() + '\n'
}

export function renderLlmsIndex(config) {
  const { facts, siteUrl } = config
  const homepage = canonicalUrl(facts.homepage.path, siteUrl)
  const lines = [
    '# ' + facts.name,
    '',
    '> ' + facts.summary,
    '',
    facts.status + ' for ' + facts.platforms.join(' and ') + '. Website examples use fictional data. ' +
    'The desktop app processes case files on the user’s device and keeps generated bundles there.',
    '',
    '## Product',
    '',
    '- [Product overview in Markdown](' + canonicalUrl(facts.homepage.markdownPath, siteUrl) + '): Scope, intended workflows and limitations.',
    '- [Product website](' + homepage + '): Public feature descriptions and interactive examples.',
    '- [Early access](' + homepage + '#early-access): Current registration availability and terms of the early access offer.',
    '',
    '## Policies',
    '',
    ...facts.legalDocuments.map(({ slug, title, description }) =>
      '- [' + title + '](' + canonicalUrl('/' + slug, siteUrl) + '): ' + description),
    '',
    '## Optional',
    '',
    '- [Complete text export](' + canonicalUrl('/llms-full.txt', siteUrl) + '): A plain-text copy of the product overview.',
  ]
  return lines.join('\n') + '\n'
}

async function writeIfChanged(path, content) {
  try {
    if (await readFile(path, 'utf8') === content) return
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  await mkdir(resolve(path, '..'), { recursive: true })
  await writeFile(path, content, 'utf8')
}

export async function generateContent({ projectRoot = PROJECT_ROOT, env = process.env } = {}) {
  const config = loadSiteConfig({ projectRoot, env })
  const definitions = config.facts.legalDocuments
  if (
    definitions.length !== LEGAL_SLUGS.length ||
    LEGAL_SLUGS.some((slug) => !definitions.some((document) => document.slug === slug))
  ) {
    throw new Error('content/site.json must define privacy, terms and refund-policy exactly once.')
  }
  const documents = await Promise.all(definitions.map(async (definition) => ({
    ...definition,
    markdown: await readFile(join(projectRoot, 'content/legal', definition.slug + '.md'), 'utf8'),
  })))
  // Only repository-owned Markdown reaches this build-time parser, never form data.
  const { Marked } = await import('marked')
  const parser = new Marked({ gfm: true, breaks: false })
  const output = new Map()
  for (const document of documents) {
    const html = parser.parse(prepareLegalMarkdown(document.markdown), { async: false })
    const data = {
      title: document.title,
      description: document.description,
      slug: document.slug,
      html,
    }
    output.set(
      'app/data/legal/' + document.slug + '.ts',
      '// Generated from content/legal/' + document.slug + '.md. Run npm run content.\n' +
      'export default ' + JSON.stringify(data, null, 2) + '\n',
    )
  }

  const product = renderProductMarkdown(config)
  output.set('public/robots.txt', renderRobots(config))
  output.set('public/sitemap.xml', renderSitemap(config))
  output.set('public/llms.txt', renderLlmsIndex(config))
  output.set('public' + config.facts.homepage.markdownPath, product)
  output.set('public/llms-full.txt', product)

  // Finish validation and parsing before replacing any previously generated file.
  for (const [path, content] of output) {
    await writeIfChanged(join(projectRoot, path), content)
  }
  const removed = []
  for (const slug of LEGAL_SLUGS) {
    const path = 'public/legal/' + slug + '.md'
    await rm(join(projectRoot, path), { force: true })
    removed.push(path)
  }
  return { config, written: [...output.keys()], removed }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await generateContent()
    console.log(
      'Generated ' + result.written.length + ' content files, including policy pages and sitemap.',
    )
  } catch (error) {
    console.error('Content generation failed: ' + error.message)
    process.exitCode = 1
  }
}
