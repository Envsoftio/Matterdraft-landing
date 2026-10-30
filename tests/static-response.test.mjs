import test from 'node:test'
import assert from 'node:assert/strict'
import { cacheControlForStaticResponse, negotiateEncoding } from '../scripts/static-response.mjs'

const both = { br: true, gzip: true }

test('absent or empty Accept-Encoding uses the original representation', () => {
  assert.equal(negotiateEncoding(undefined, both), 'identity')
  assert.equal(negotiateEncoding('', both), 'identity')
  assert.equal(negotiateEncoding('  ', both), 'identity')
})

test('encoding selection respects quality, exclusions, and available sidecars', () => {
  assert.equal(negotiateEncoding('br;q=0, gzip;q=1', both), 'gzip')
  assert.equal(negotiateEncoding('br;q=0.2, gzip;q=0.8', both), 'gzip')
  assert.equal(negotiateEncoding('gzip, br', both), 'br')
  assert.equal(negotiateEncoding('BR; Q=0.5, GZIP;Q=0.2', both), 'br')
  assert.equal(negotiateEncoding('br, gzip;q=0.5', { gzip: true }), 'gzip')
  assert.equal(negotiateEncoding('br', { gzip: true }), 'identity')
})

test('explicit entries override wildcard preferences', () => {
  assert.equal(negotiateEncoding('*;q=0.8, br;q=0', both), 'gzip')
  assert.equal(negotiateEncoding('*;q=0, gzip;q=0.2', both), 'gzip')
  assert.equal(negotiateEncoding('*', both), 'br')
  assert.equal(negotiateEncoding('*;q=0, identity;q=0.1', both), 'identity')
})

test('explicit identity is weighted and implicit identity remains a fallback', () => {
  assert.equal(negotiateEncoding('br;q=0.5, identity;q=1', both), 'identity')
  assert.equal(negotiateEncoding('br;q=0.5, identity;q=0.2', both), 'br')
  assert.equal(negotiateEncoding('br;q=0.5', both), 'br')
  assert.equal(negotiateEncoding('br;q=0, gzip;q=0', both), 'identity')
  assert.equal(negotiateEncoding('compress', both), 'identity')
})

test('no acceptable representation returns null for a 406 response', () => {
  assert.equal(negotiateEncoding('br;q=0, gzip;q=0, identity;q=0', both), null)
  assert.equal(negotiateEncoding('*;q=0', both), null)
  assert.equal(negotiateEncoding('br, identity;q=0', { gzip: true }), null)
  assert.equal(negotiateEncoding('identity;q=0', both), null)
  assert.equal(negotiateEncoding('br, identity;q=0', both), 'br')
})

test('malformed and conflicting weights cannot silently enable rejected codings', () => {
  assert.equal(negotiateEncoding('br;q=invalid, gzip;q=0.5', both), 'gzip')
  assert.equal(negotiateEncoding('br;q=1.1, gzip;q=0.1234', both), 'identity')
  assert.equal(negotiateEncoding('br;q=0, br;q=1, gzip', both), 'gzip')
  assert.equal(negotiateEncoding(['br;q=0', 'gzip;q=1'], both), 'gzip')
})

test('only successful immutable assets get the long cache lifetime', () => {
  assert.equal(cacheControlForStaticResponse('/_nuxt/entry.ABC123.js', 200), 'public, max-age=31536000, immutable')
  assert.equal(cacheControlForStaticResponse('/_nuxt/missing.js', 404), 'no-cache')
  assert.equal(cacheControlForStaticResponse('/fonts/missing.woff2', 404), 'no-cache')
  assert.equal(cacheControlForStaticResponse('/_nuxt/builds/latest.json', 200), 'no-cache')
  assert.equal(cacheControlForStaticResponse('/fonts/inter.woff2', 200), 'public, max-age=86400')
  assert.equal(cacheControlForStaticResponse('/', 200), 'no-cache')
})
