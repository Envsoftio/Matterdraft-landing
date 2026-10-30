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

export function findUnresolvedBusinessFields(markdown) {
  return [...new Set(
    [...markdown.matchAll(/\[([A-Z][A-Z0-9_]{2,})(?:[ \t]+[—–-][^\]\r\n]*)?\]/g)]
      .map((match) => match[1]),
  )].sort()
}

export function assertLegalPublicationReady(documents, legalPublished) {
  if (!legalPublished) return
  const unresolved = documents.flatMap(({ slug, markdown }) => {
    const fields = findUnresolvedBusinessFields(markdown)
    return fields.length ? [slug + ': ' + fields.join(', ')] : []
  })
  if (unresolved.length) {
    throw new Error(
      'LEGAL_PUBLISHED=true cannot publish unresolved business fields:\n' +
      unresolved.join('\n') +
      '\nComplete the source policies and review them before enabling publication.',
    )
  }
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

function rewriteLegalLink(href, siteUrl, markdown = false) {
  const match = href.match(/^([^?#]+)([?#].*)?$/)
  if (!match) return href
  const slug = LEGAL_LINKS.get(match[1].replace(/^\.\//, ''))
  if (!slug) return href
  const path = markdown ? '/legal/' + slug + '.md' : '/' + slug
  return (markdown ? canonicalUrl(path, siteUrl) : path) + (match[2] || '')
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
  const routes = paths || [
    '/',
    ...(config.legalPublished ? LEGAL_SLUGS.map((slug) => '/' + slug) : []),
  ]
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
    '## Contact and availability',
    '',
    'Use the website to prepare a demo enquiry and ask about current availability. ' +
    'Only an explicitly configured contact channel sends an enquiry; no backend or purchase flow is implied.',
    '',
    '## Policies',
    '',
  ]
  if (config.legalPublished) {
    lines.push(...facts.legalDocuments.map(({ slug, title, description }) =>
      '- [' + title + '](' + canonicalUrl('/' + slug, siteUrl) + '): ' + description))
  } else {
    lines.push(
      'The website policy pages are review drafts awaiting business details and adoption. ' +
      'They are not final published policies and are excluded from the sitemap and this content export.',
    )
  }
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
    '- [Complete content export](' + canonicalUrl('/llms-full.txt', siteUrl) + '): The product overview' +
      (config.legalPublished ? ' and published policy text.' : '; draft policies are excluded.'),
  ]
  if (config.legalPublished) {
    lines.push('', '## Policies', '', ...facts.legalDocuments.map(({ slug, title, description }) =>
      '- [' + title + '](' + canonicalUrl('/legal/' + slug + '.md', siteUrl) + '): ' + description))
  } else {
    lines.splice(5, 0,
      'Legal pages are review drafts awaiting completion and adoption, not final published policies.', '')
  }
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
  assertLegalPublicationReady(documents, config.legalPublished)

  // Only repository-owned Markdown reaches this build-time parser, never form data.
  const { Marked } = await import('marked')
  const parser = new Marked({
    gfm: true,
    breaks: false,
    walkTokens(token) {
      if (token.type === 'link') token.href = rewriteLegalLink(token.href, config.siteUrl)
    },
  })
  const output = new Map()
  const publicPolicies = []
  for (const document of documents) {
    const prepared = prepareLegalMarkdown(document.markdown)
    const html = parser.parse(prepared.body, { async: false })
    const data = {
      title: document.title,
      description: (config.legalPublished ? '' : 'Review draft. ') + document.description,
      slug: document.slug,
      html,
    }
    output.set(
      'app/data/legal/' + document.slug + '.ts',
      '// Generated from content/legal/' + document.slug + '.md. Run npm run content.\n' +
      'export default ' + JSON.stringify(data, null, 2) + '\n',
    )
    if (config.legalPublished) {
      const publicMarkdown = prepared.markdown.replace(/\]\(([^)\s]+)\)/g, (match, href) =>
        '](' + rewriteLegalLink(href, config.siteUrl, true) + ')')
      output.set('public/legal/' + document.slug + '.md', publicMarkdown)
      publicPolicies.push(publicMarkdown)
    }
  }

  const product = renderProductMarkdown(config)
  output.set('public/robots.txt', renderRobots(config))
  output.set('public/sitemap.xml', renderSitemap(config))
  output.set('public/llms.txt', renderLlmsIndex(config))
  output.set('public/index.md', product)
  output.set('public/llms-full.txt', [product, ...publicPolicies].join('\n---\n\n'))

  // Finish validation and parsing before replacing any previously generated file.
  for (const [path, content] of output) {
    await writeIfChanged(join(projectRoot, path), content)
  }
  const removed = []
  if (!config.legalPublished) {
    for (const slug of LEGAL_SLUGS) {
      const path = 'public/legal/' + slug + '.md'
      await rm(join(projectRoot, path), { force: true })
      removed.push(path)
    }
  }
  return { config, written: [...output.keys()], removed }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await generateContent()
    console.log(
      'Generated ' + result.written.length + ' content files; legal policies ' +
      (result.config.legalPublished ? 'published.' : 'remain review drafts and are excluded from discovery.'),
    )
  } catch (error) {
    console.error('Content generation failed: ' + error.message)
    process.exitCode = 1
  }
}
