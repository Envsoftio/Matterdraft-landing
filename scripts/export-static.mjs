import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { brotliCompressSync, constants, gzipSync } from 'node:zlib'
import { dirname, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadSiteConfig } from './site-config.mjs'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const settings = loadSiteConfig({ projectRoot: root })
const destination = join(root, 'dist')
await rm(destination, { recursive: true, force: true })
await cp(join(root, '.output/public'), destination, { recursive: true })

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const result = []
  for (const entry of entries) {
    const full = join(directory, entry.name)
    if (entry.isDirectory()) result.push(...await filesIn(full))
    else result.push(full)
  }
  return result
}

const files = await filesIn(destination)
const scriptHashes = new Set()
for (const file of files.filter(file => file.endsWith('.html'))) {
  const html = await readFile(file, 'utf8')
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (!/\bsrc\s*=/.test(match[1]) && match[2]) {
      scriptHashes.add(`'sha256-${createHash('sha256').update(match[2]).digest('base64')}'`)
    }
  }
}
const csp = [
  "default-src 'self'", `script-src 'self' ${[...scriptHashes].join(' ')}`,
  "style-src 'self' 'unsafe-inline'", "img-src 'self' data:", "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'", "base-uri 'self'", "frame-ancestors 'none'", "form-action 'self'",
].join('; ')
// Keep the hash policy beside the exact HTML it protects. Static hosts may read
// their project config before the build, so generated hashes cannot safely live
// only in a checked-in vercel.json. frame-ancestors still requires an HTTP header.
const metaCsp = csp.replace(/; frame-ancestors 'none'/, '')
const escapedMetaCsp = metaCsp.replaceAll('&', '&amp;').replaceAll('"', '&quot;')
for (const file of files.filter(file => file.endsWith('.html'))) {
  const html = await readFile(file, 'utf8')
  const meta = `<meta http-equiv="Content-Security-Policy" content="${escapedMetaCsp}">`
  const updated = html.replace(/(<head>\s*<meta charset="[^"]+">)/i, `$1${meta}`)
  if (updated === html) throw new Error(`Cannot place the CSP before scripts in ${file}`)
  await writeFile(file, updated)
}
const commonHeaders = {
  'Content-Security-Policy': csp,
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  Link: '</llms.txt>; rel="describedby"',
}
const headerLines = ['/*', ...Object.entries(commonHeaders).map(([name,value]) => `  ${name}: ${value}`),
  '', '/_nuxt/*', '  Cache-Control: public, max-age=31536000, immutable',
  '', '/_nuxt/builds/latest.json', '  Cache-Control: no-cache',
  '', '/fonts/*', '  Cache-Control: public, max-age=86400, stale-while-revalidate=604800',
  '', '/brand/*', '  Cache-Control: public, max-age=86400',
  '', '/og/*', '  Cache-Control: public, max-age=86400',
  '', '/', '  Link: </index.md>; rel="alternate"; type="text/markdown", </llms.txt>; rel="describedby"',
  '', '/404.html', '  X-Robots-Tag: noindex, follow',
]
for (const route of ['/privacy', '/terms', '/refund-policy']) headerLines.push('', route, '  X-Robots-Tag: noindex, follow')
if (!settings.indexable) headerLines.push('', '/*', '  X-Robots-Tag: noindex, nofollow')
await writeFile(join(destination, '_headers'), `${headerLines.join('\n')}\n`)
await mkdir(join(root, 'deploy'), { recursive: true })
await writeFile(join(root, 'deploy/headers.json'), `${JSON.stringify({ commonHeaders, indexable: settings.indexable }, null, 2)}\n`)
// Build-specific hashes and deployment flags live in HTML, not Vercel's
// pre-build configuration. These HTTP directives remain stable across builds.
const vercelHeaders = {
  ...commonHeaders,
  'Content-Security-Policy': "frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
}
await writeFile(join(root, 'vercel.json'), `${JSON.stringify({
  $schema: 'https://openapi.vercel.sh/vercel.json', buildCommand: 'npm run generate', outputDirectory: 'dist',
  framework: null, cleanUrls: true, trailingSlash: false,
  headers: [
    { source: '/(.*)', headers: Object.entries(vercelHeaders).map(([key,value])=>({key,value})) },
    { source: '/_nuxt/(.*)', headers: [{key:'Cache-Control',value:'public, max-age=31536000, immutable'}] },
    { source: '/_nuxt/builds/latest.json', headers: [{key:'Cache-Control',value:'no-cache'}] },
    { source: '/fonts/(.*)', headers: [{key:'Cache-Control',value:'public, max-age=86400'}] },
    { source: '/404.html', headers: [{key:'X-Robots-Tag',value:'noindex, follow'}] },
  ],
},null,2)}\n`)

// Static compression is included for hosts that can negotiate these sidecars.
// Netlify/Cloudflare/Vercel can also compress the original files themselves.
let compressed = 0
for (const file of files) {
  if (!['.html','.css','.js','.json','.svg','.txt','.xml','.md'].includes(extname(file))) continue
  const content = await readFile(file)
  if (content.length < 1024) continue
  await writeFile(`${file}.gz`, gzipSync(content, { level: 9 }))
  await writeFile(`${file}.br`, brotliCompressSync(content, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }))
  compressed++
}
console.log(`Static build copied to dist/; security/cache headers and ${compressed} compressed asset pairs created.`)
