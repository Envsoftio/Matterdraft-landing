import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { canonicalUrl, loadSiteConfig, PROJECT_ROOT } from './site-config.mjs'

const LEGAL_SLUGS = ['privacy', 'terms', 'refund-policy']
const LEGAL_LINKS = new Map([
  ['MatterDraft-Privacy-Policy.md', 'privacy'],
  ['MatterDraft-Terms-and-Conditions.md', 'terms'],
  ['MatterDraft-Refund-Policy.md', 'refund-policy'],
  ['privacy.md', 'privacy'],
  ['terms.md', 'terms'],
  ['refund-policy.md', 'refund-policy'],
])

export function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
  })[character])
}

export function prepareLegalMarkdown(markdown) {
  const normalized = markdown.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n')
  const appendix = normalized.search(/^##[ \t]+Publication notes\b.*$/im)
  const publicBody = (appendix < 0 ? normalized : normalized.slice(0, appendix))
    .replace(/\n[ \t]*(?:---|\*\*\*|___)[ \t]*\n*$/, '')
    .trim()
  const heading = publicBody.match(/^#[ \t]+([^\n]+)\n*/)
  if (!heading) throw new Error('Every legal source must start with one level-one title.')
  return {
    markdown: publicBody + '\n',
    body: publicBody.slice(heading[0].length).trim() + '\n',
  }
}

function rewriteLegalLink(href) {
  const match = href.match(/^([^?#]+)([?#].*)?$/)
  if (!match) return href
  const slug = LEGAL_LINKS.get(match[1].replace(/^\.\//, ''))
  if (!slug) return href
  return '/' + slug + (match[2] || '')
}

export function renderRobots(config) {
  if (!config.indexable) return 'User-agent: *\nDisallow: /\n'
  return [
    'User-agent: *',
    'Disallow: /api',
    '',
    'Sitemap: ' + canonicalUrl('/sitemap.xml', config.siteUrl),
    '',
  ].join('\n')
}

export function renderSitemap(config, paths) {
  const routes = paths || ['/']
  const entries = config.indexable
    ? [...new Set(routes)].map((path) =>
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
  const lines = [
    '# ' + facts.name,
    '',
    '> ' + facts.summary,
    '',
    'Website: ' + canonicalUrl('/', siteUrl),
    '',
    'Status: In development for ' + facts.platforms.join(' and ') + '.',
    '',
    '## Product scope',
    '',
    ...facts.qualifications.map((qualification) => '- ' + qualification),
    '',
    '## Intended workflows',
    '',
    ...facts.capabilities.flatMap(({ title, description }) => [
      '### ' + title, '', description, '',
    ]),
    '## Availability',
    '',
    'MatterDraft Studio is in development. Release timing has not been announced. ' +
    'This website does not accept enquiries or provide a purchase flow.',
    '',
    '## Policies',
    '',
    'The website policy pages are review drafts awaiting business details and adoption. ' +
    'They are excluded from the sitemap and this content export.',
  ]
  return lines.join('\n').trimEnd() + '\n'
}

export function renderLlmsIndex(config) {
  const { facts, siteUrl } = config
  const lines = [
    '# ' + facts.name,
    '',
    '> ' + facts.summary,
    '',
    'In development for Windows and macOS. Website examples use fictional data and do not ' +
    'establish released functionality. There is no website checkout. Outputs require professional review.',
    '',
    'Local-first does not mean every connected feature works offline. OCR produces editable ' +
    'recognised text; it is not generative legal advice or a guarantee of accuracy.',
    '',
    '## Product',
    '',
    '- [Product overview](' + canonicalUrl('/index.md', siteUrl) + '): Scope, intended workflows and limitations.',
    '- [Complete content export](' + canonicalUrl('/llms-full.txt', siteUrl) + '): The product overview; draft policies are excluded.',
  ]
  lines.splice(5, 0,
    'Legal pages are review drafts awaiting completion and adoption, not final published policies.', '')
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
  const parser = new Marked({
    gfm: true,
    breaks: false,
    walkTokens(token) {
      if (token.type === 'link') token.href = rewriteLegalLink(token.href)
    },
  })
  const output = new Map()
  for (const document of documents) {
    const prepared = prepareLegalMarkdown(document.markdown)
    const html = parser.parse(prepared.body, { async: false })
    const data = {
      title: document.title,
      description: 'Review draft. ' + document.description,
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
  output.set('public/index.md', product)
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
      'Generated ' + result.written.length + ' content files; legal policies remain review drafts and are excluded from discovery.',
    )
  } catch (error) {
    console.error('Content generation failed: ' + error.message)
    process.exitCode = 1
  }
}
