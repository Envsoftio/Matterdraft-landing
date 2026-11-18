import { createServer } from 'node:http'
import { existsSync } from 'node:fs'
import { readFile, stat } from 'node:fs/promises'
import { dirname, extname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { cacheControlForStaticResponse, negotiateEncoding } from './static-response.mjs'
import { NO_INDEX } from './discovery.mjs'
import earlyAccess from '../lib/early-access-sheets.mjs'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const envFile = join(root, '.env')
if (existsSync(envFile)) process.loadEnvFile(envFile)
const directory = join(root, 'dist')
const { values } = parseArgs({ options: { port: { type: 'string' }, host: { type: 'string' }, strictPort: { type: 'boolean' } } })
const port = Number(values.port || process.env.PORT || 3000)
const host = values.host || process.env.HOST || '0.0.0.0'
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Preview port must be an integer from 1 to 65535.')
const deployment = JSON.parse(await readFile(join(root, 'deploy/headers.json'), 'utf8'))
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.webmanifest':'application/manifest+json', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.woff2':'font/woff2', '.txt':'text/plain; charset=utf-8', '.xml':'application/xml; charset=utf-8', '.md':'text/markdown; charset=utf-8' }
const exists = async path => { try { return (await stat(path)).isFile() } catch { return false } }

createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', 'http://localhost')
    if (url.pathname === '/.netlify/functions/early-access') {
      const signupRequest = new Request(url, {
        method: request.method, headers: request.headers,
        ...(request.method === 'POST' && { body: request, duplex: 'half' }),
      })
      const result = await earlyAccess(signupRequest)
      response.writeHead(result.status, Object.fromEntries(result.headers))
      response.end(await result.text())
      return
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { Allow: 'GET, HEAD', 'Content-Type':'text/plain; charset=utf-8' })
      response.end('Method not allowed. This static site does not accept submissions.')
      return
    }
    const pathname = decodeURIComponent(url.pathname)
    if (pathname.includes('\0')) throw new Error('Invalid path')
    const candidate = resolve(directory, `.${pathname}`)
    if (candidate !== directory && !candidate.startsWith(`${directory}${sep}`)) {
      response.writeHead(403); response.end('Forbidden'); return
    }
    let file = candidate
    if (!await exists(file)) file = join(candidate, 'index.html')
    let status = 200
    if (!await exists(file)) { file = join(directory, '404.html'); status = 404 }
    const route = '/' + relative(directory, file).split(sep).join('/').replace(/(?:^|\/)index\.html$/, '')
    const headers = {
      ...deployment.commonHeaders,
      'Content-Type': mime[extname(file)] || 'application/octet-stream',
      ...deployment.discoveryHeaders?.[route],
      Vary: 'Accept-Encoding',
    }
    headers['Cache-Control'] = cacheControlForStaticResponse(pathname, status)
    if (status === 404) headers['X-Robots-Tag'] = NO_INDEX
    const [br, gzip] = await Promise.all([exists(`${file}.br`), exists(`${file}.gz`)])
    const encoding = negotiateEncoding(request.headers['accept-encoding'], { br, gzip })
    if (encoding === null) {
      response.writeHead(406, { ...headers, 'Content-Type': 'text/plain; charset=utf-8', 'Content-Length': '0', 'Cache-Control': 'no-cache', 'X-Robots-Tag': NO_INDEX })
      response.end()
      return
    }
    let transfer = file
    if (encoding !== 'identity') {
      transfer = `${file}.${encoding === 'br' ? 'br' : 'gz'}`
      headers['Content-Encoding'] = encoding
    }
    const content = await readFile(transfer)
    headers['Content-Length'] = String(content.length)
    response.writeHead(status,headers)
    response.end(request.method==='HEAD'?undefined:content)
  } catch {
    response.writeHead(400, { 'Content-Type':'text/plain; charset=utf-8' }); response.end('Unable to serve this request.')
  }
}).listen(port, host, () => {
  console.log(`Serving the production dist/ build on http://${host}:${port}`)
})
