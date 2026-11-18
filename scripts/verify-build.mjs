import assert from 'node:assert/strict'
import { readFile, readdir, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { createHash } from 'node:crypto'
import { DRAFT_ROBOTS, NO_INDEX } from './discovery.mjs'
import { loadSiteConfig } from './site-config.mjs'

const root=dirname(dirname(fileURLToPath(import.meta.url))),dist=join(root,'dist')
const settings=loadSiteConfig({projectRoot:root})
const { homepage, legalDocuments, socialImage } = settings.facts
const pages=['', ...legalDocuments.map(({ slug }) => slug)]
const pageReports=[]
for(const route of pages){
  const html=await readFile(join(dist,route,'index.html'),'utf8')
  const canonical=new URL(route?`/${route}`:'/',settings.siteUrl).href
  assert(html.includes(`rel="canonical" href="${canonical}"`)||html.includes(`href="${canonical}" rel="canonical"`),`Missing canonical on /${route}`)
  assert.equal([...html.matchAll(/<h1(?:\s|>)/g)].length,1,`Expected one H1 on /${route}`)
  assert(/<meta\s+name="description"\s+content="[^\"]+"/.test(html),`Missing description on /${route}`)
  assert(html.includes('property="og:image"'),`Missing social image on /${route}`)
  const robots = [...html.matchAll(/<meta name="robots" content="([^"]+)">/g)].map((match) => match[1])
  const expectedRobots = !settings.indexable ? NO_INDEX : route ? DRAFT_ROBOTS : 'index, follow, max-image-preview:large'
  assert.deepEqual(robots, [expectedRobots], `Incorrect robots metadata on /${route}`)
  assert(html.includes(new URL(socialImage.path, settings.siteUrl).href), `Missing absolute social image on /${route}`)
  assert(!html.includes('data:font/'),'Embedded font data should be externalized')
  assert(!html.includes('fonts.googleapis.com'),'Font must be self-hosted')
  const ids=[...html.matchAll(/\sid="([^\"]+)"/g)].map(m=>m[1])
  assert.equal(ids.length,new Set(ids).size,`Duplicate IDs on /${route}`)
  const cspMeta=html.match(/<meta http-equiv="Content-Security-Policy" content="([^\"]+)">/i)
  assert(cspMeta,`Build-specific CSP is missing from /${route}`)
  assert(html.indexOf(cspMeta[0])<html.indexOf('<script'),`CSP must precede scripts on /${route}`)
  for(const script of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
    if(!/\bsrc\s*=/.test(script[1])&&script[2]){
      const hash=`sha256-${createHash('sha256').update(script[2]).digest('base64')}`
      assert(cspMeta[1].includes(hash),`Inline script hash missing from CSP on /${route}`)
    }
  }
  pageReports.push({route:`/${route}`,htmlBytes:Buffer.byteLength(html),gzipBytes:gzipSync(html).length})
}
const home=await readFile(join(dist,'index.html'),'utf8')
assert(home.includes(`<title>${homepage.title}</title>`), 'Homepage title does not match the site configuration')
assert.equal(home.includes('type="text/markdown"'), settings.indexable, 'Unexpected Markdown alternate on homepage')
for(const required of ['From case documents','to organised bundles.','196','Fictional','matterdraft-structured-data'])assert(home.includes(required),`Missing server-rendered content: ${required}`)
for(const required of ['https://forms.gle/oZ4ziNTZoQ3QWEoh6','Early access registration','one month free after launch',settings.earlyAccessEnabled ? 'Share your details' : 'Registration isn’t open yet'])assert(home.includes(required),`Missing early access content: ${required}`)
assert(!home.includes('Request a demo')&&!home.includes('data-demo')&&!home.includes('demo-dialog'),'Demo request UI must be absent')
const structured=[...home.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].find(m=>m[1].includes('application/ld+json'))
assert(structured,'JSON-LD missing')
const schema=JSON.parse(structured[2])
const software = schema['@graph'].find((node) => node['@type'] === 'SoftwareApplication')
const webPage = schema['@graph'].find((node) => node['@type'] === 'WebPage')
assert.equal(software?.creativeWorkStatus, settings.facts.status, 'Software development status missing')
assert.equal(webPage?.mainEntity['@id'], software['@id'], 'Homepage structured data must link to the software')
assert(!schema['@graph'].some(n=>n.offers||n.aggregateRating),'No invented pricing or ratings')
for(const file of ['robots.txt','sitemap.xml','llms.txt','llms-full.txt','index.md','favicon.svg','favicon-32.png','apple-touch-icon.png','site.webmanifest','og/matterdraft-social.jpg','fonts/plus-jakarta-sans-latin-variable.woff2','fonts/jetbrains-mono-medium.woff2','brand/studio-wordmark-light.png','brand/studio-wordmark-dark.png','_headers','404.html'])assert((await stat(join(dist,file))).size>0,`Missing ${file}`)
const sitemap=await readFile(join(dist,'sitemap.xml'),'utf8')
assert(sitemap.includes('<urlset'),'Invalid sitemap')
const canonical = new URL(homepage.path, settings.siteUrl).href
const sitemapEntries = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])
assert.deepEqual(sitemapEntries, settings.indexable ? [canonical] : [], 'Sitemap includes unexpected URLs')
const robots = await readFile(join(dist, 'robots.txt'), 'utf8')
assert.equal(robots.includes(`Sitemap: ${new URL('/sitemap.xml', settings.siteUrl).href}`), settings.indexable)
const llms=await readFile(join(dist,'llms.txt'),'utf8');assert(llms.startsWith('# MatterDraft'),'llms.txt H1 missing');assert(llms.includes('/index.md'),'Markdown product description not discoverable')
const product = await readFile(join(dist, homepage.markdownPath.slice(1)), 'utf8')
for (const anchor of [...settings.facts.capabilities.map((capability) => capability.anchor), 'early-access']) {
  assert(home.includes(`id="${anchor}"`), `Markdown points to a missing homepage anchor: ${anchor}`)
  assert(product.includes(canonical + '#' + anchor), `Markdown is missing a homepage link: ${anchor}`)
}
const assetNames=(await readdir(join(dist,'_nuxt'))).filter(name=>/\.(js|css)$/.test(name))
let jsBytes=0,jsGzip=0,cssBytes=0,cssGzip=0
for(const name of assetNames){const data=await readFile(join(dist,'_nuxt',name));if(name.endsWith('.js')){jsBytes+=data.length;jsGzip+=gzipSync(data).length}else{cssBytes+=data.length;cssGzip+=gzipSync(data).length}}
const landingFonts = ['plus-jakarta-sans-latin-variable.woff2', 'jetbrains-mono-medium.woff2']
const fontBytes = (await Promise.all(landingFonts.map(file => stat(join(dist, 'fonts', file))))).reduce((sum, file) => sum + file.size, 0)
assert(jsGzip<250*1024,`All-route JS gzip budget exceeded: ${jsGzip}`)
assert(cssGzip<48*1024,`CSS gzip budget exceeded: ${cssGzip}`)
assert(fontBytes<180*1024,`Font budget exceeded: ${fontBytes}`)
const report={checkedAt:new Date().toISOString(),result:'passed',pages:pageReports,assets:{allRoutesJsBytes:jsBytes,allRoutesJsGzipBytes:jsGzip,allCssBytes:cssBytes,allCssGzipBytes:cssGzip,fontBytes},note:'All-route totals include policy chunks; these are size checks, not a Lighthouse score or a real-user loading-time guarantee.'}
console.log(JSON.stringify(report,null,2))
