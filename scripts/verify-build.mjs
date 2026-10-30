import assert from 'node:assert/strict'
import { readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { createHash } from 'node:crypto'
import { loadSiteConfig } from './site-config.mjs'

const root=dirname(dirname(fileURLToPath(import.meta.url))),dist=join(root,'dist')
const settings=loadSiteConfig({projectRoot:root})
const pages=['','privacy','terms','refund-policy']
const pageReports=[]
for(const route of pages){
  const html=await readFile(join(dist,route,'index.html'),'utf8')
  const canonical=new URL(route?`/${route}`:'/',settings.siteUrl).href
  assert(html.includes(`rel="canonical" href="${canonical}"`)||html.includes(`href="${canonical}" rel="canonical"`),`Missing canonical on /${route}`)
  assert.equal([...html.matchAll(/<h1(?:\s|>)/g)].length,1,`Expected one H1 on /${route}`)
  assert(/<meta\s+name="description"\s+content="[^\"]+"/.test(html),`Missing description on /${route}`)
  assert(html.includes('property="og:image"'),`Missing social image on /${route}`)
  if(route)assert(/name="robots"[^>]+noindex/.test(html),`Draft policy must be noindex: ${route}`)
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
for(const required of ['Complex legal files.','196','In development','Fictional','matterdraft-structured-data'])assert(home.includes(required),`Missing server-rendered content: ${required}`)
for(const required of ['https://forms.gle/oZ4ziNTZoQ3QWEoh6','Early access registration','six months free after launch','Registration isn’t open yet'])assert(home.includes(required),`Missing early access content: ${required}`)
assert(!home.includes('Request a demo')&&!home.includes('data-demo')&&!home.includes('demo-dialog'),'Demo request UI must be absent')
const structured=[...home.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].find(m=>m[1].includes('application/ld+json'))
assert(structured,'JSON-LD missing')
const schema=JSON.parse(structured[2]);assert(schema['@graph'].some(n=>n.creativeWorkStatus==='In development'),'Structured data must preserve development status')
assert(!schema['@graph'].some(n=>n.offers||n.aggregateRating),'No invented pricing or ratings')
for(const file of ['robots.txt','sitemap.xml','llms.txt','llms-full.txt','index.md','favicon.svg','favicon-32.png','apple-touch-icon.png','site.webmanifest','og/matterdraft-social.jpg','fonts/inter-latin-variable.woff2','_headers','404.html'])assert((await stat(join(dist,file))).size>0,`Missing ${file}`)
const sitemap=await readFile(join(dist,'sitemap.xml'),'utf8')
assert(sitemap.includes('<urlset'),'Invalid sitemap')
for(const route of pages.slice(1))assert(!sitemap.includes(`/${route}<`),'Draft policy must not appear in sitemap')
const llms=await readFile(join(dist,'llms.txt'),'utf8');assert(llms.startsWith('# MatterDraft'),'llms.txt H1 missing');assert(llms.includes('/index.md'),'Markdown product description not discoverable')
const assetNames=(await readdir(join(dist,'_nuxt'))).filter(name=>/\.(js|css)$/.test(name))
let jsBytes=0,jsGzip=0,cssBytes=0,cssGzip=0
for(const name of assetNames){const data=await readFile(join(dist,'_nuxt',name));if(name.endsWith('.js')){jsBytes+=data.length;jsGzip+=gzipSync(data).length}else{cssBytes+=data.length;cssGzip+=gzipSync(data).length}}
const fontBytes=(await stat(join(dist,'fonts/inter-latin-variable.woff2'))).size
assert(jsGzip<250*1024,`All-route JS gzip budget exceeded: ${jsGzip}`)
assert(cssGzip<48*1024,`CSS gzip budget exceeded: ${cssGzip}`)
assert(fontBytes<180*1024,`Font budget exceeded: ${fontBytes}`)
const report={checkedAt:new Date().toISOString(),result:'passed',pages:pageReports,assets:{allRoutesJsBytes:jsBytes,allRoutesJsGzipBytes:jsGzip,allCssBytes:cssBytes,allCssGzipBytes:cssGzip,fontBytes},note:'All-route totals include policy chunks; these are size checks, not a Lighthouse score or a real-user loading-time guarantee.'}
await writeFile(join(root,'BUILD-REPORT.json'),JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify(report,null,2))
