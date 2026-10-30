/**
 * Choose an available representation using RFC 9110 section 12.5.3.
 * An implicit identity representation is a fallback; an explicit identity
 * quality participates in the preference order. Ties prefer br, then gzip.
 *
 * @param {string | string[] | undefined} header
 * @param {{ br?: boolean, gzip?: boolean }} available
 * @returns {'br' | 'gzip' | 'identity' | null}
 */
export function negotiateEncoding(header, available = {}) {
  const value = Array.isArray(header) ? header.join(',') : header
  // No header permits any representation; use the uncompressed original.
  // An empty header explicitly asks for no content coding.
  if (!value?.trim()) return 'identity'

  const qualities = new Map()
  for (const item of value.split(',')) {
    const [rawCoding, ...parameters] = item.trim().split(';')
    const coding = rawCoding?.trim().toLowerCase()
    if (!coding || !/^[!#$%&'*+.^_`|~0-9a-z-]+$/.test(coding)) continue

    let quality = 1
    if (parameters.length) {
      const weight = parameters.length === 1
        ? parameters[0].match(/^\s*q\s*=\s*(0(?:\.\d{0,3})?|1(?:\.0{0,3})?)\s*$/i)
        : null
      // Invalid weights must never turn a refused coding into an accepted one.
      quality = weight ? Number(weight[1]) : 0
    }
    // Conflicting duplicate entries are handled conservatively (q=0 wins).
    qualities.set(coding, Math.min(qualities.get(coding) ?? 1, quality))
  }

  let selected = null
  let selectedQuality = 0
  for (const coding of ['br', 'gzip']) {
    const quality = qualities.get(coding) ?? qualities.get('*') ?? 0
    if (available[coding] && quality > selectedQuality) {
      selected = coding
      selectedQuality = quality
    }
  }

  const identityQuality = qualities.get('identity')
  if (identityQuality !== undefined && identityQuality > selectedQuality) return 'identity'
  if (selected) return selected
  if (identityQuality !== undefined) return identityQuality > 0 ? 'identity' : null
  return qualities.get('*') === 0 ? null : 'identity'
}

/** @param {string} pathname @param {number} status */
export function cacheControlForStaticResponse(pathname, status) {
  if (status !== 200 || pathname === '/_nuxt/builds/latest.json') return 'no-cache'
  if (pathname.startsWith('/_nuxt/')) return 'public, max-age=31536000, immutable'
  if (pathname.startsWith('/fonts/')) return 'public, max-age=86400'
  return 'no-cache'
}
