export const NO_INDEX = 'noindex, nofollow'
export const DRAFT_ROBOTS = 'noindex, follow'

export const privateAreas = ['/api', '/.netlify/functions', '/a', '/internal', '/invite', '/portal']

const authPages = ['/sign-in', '/sign-up', '/forgot-password', '/reset-password', '/verify-email', '/consent']

export function discoveryHeaders({ facts, indexable, siteUrl }) {
  const { homepage, legalDocuments } = facts
  const headers = {}

  for (const path of privateAreas) {
    const privateHeaders = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': NO_INDEX }
    headers[path] = privateHeaders
    headers[`${path}/**`] = privateHeaders
  }
  for (const path of [...authPages, '/maintenance.html', '/200.html', '/404.html', '/__nuxt_error']) {
    headers[path] = { 'X-Robots-Tag': NO_INDEX }
  }
  for (const { slug } of legalDocuments) {
    headers[`/${slug}`] = { 'X-Robots-Tag': indexable ? DRAFT_ROBOTS : NO_INDEX }
  }

  headers[homepage.markdownPath] = { 'Content-Type': 'text/markdown; charset=utf-8' }
  if (indexable) {
    const canonical = new URL(homepage.path, siteUrl).href
    headers[homepage.path] = {
      Link: `<${homepage.markdownPath}>; rel="alternate"; type="text/markdown", </llms.txt>; rel="describedby"`,
    }
    headers[homepage.markdownPath].Link = `<${canonical}>; rel="canonical"`
    headers['/llms-full.txt'] = { Link: `<${canonical}>; rel="canonical"` }
    headers['/llms.txt'] = { 'X-Robots-Tag': DRAFT_ROBOTS }
  } else {
    headers['/**'] = { 'X-Robots-Tag': NO_INDEX }
  }

  return headers
}
