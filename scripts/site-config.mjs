import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const PROJECT_ROOT = fileURLToPath(new URL('../', import.meta.url))

const defaultFacts = JSON.parse(readFileSync(join(PROJECT_ROOT, 'content/site.json'), 'utf8'))

// Canonicals, metadata and generated discovery files share this validated origin.
export function validateSiteOrigin(value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('NUXT_PUBLIC_SITE_URL must be an absolute HTTPS origin.')
  }
  const input = value.trim()
  let url
  try {
    url = new URL(input)
  } catch {
    throw new Error('NUXT_PUBLIC_SITE_URL must be an absolute HTTPS origin.')
  }
  if (
    !/^https:\/\/[^/?#\\\s]+\/?$/i.test(input) ||
    url.protocol !== 'https:' ||
    !url.hostname ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/'
  ) {
    throw new Error('NUXT_PUBLIC_SITE_URL must be an HTTPS origin without a path, query, fragment or credentials.')
  }
  return url.origin
}

function booleanValue(value, fallback, name) {
  if (value === undefined || value === null || value === '') return fallback
  const text = String(value).trim().toLowerCase()
  if (text === 'true' || text === '1') return true
  if (text === 'false' || text === '0') return false
  throw new Error(name + ' must be true or false.')
}

function booleanSetting(env, name, fallback) {
  const alias = 'NUXT_PUBLIC_' + name
  const direct = booleanValue(env[name], fallback, name)
  const publicValue = booleanValue(env[alias], fallback, alias)
  const hasDirect = env[name] !== undefined && env[name] !== ''
  const hasPublic = env[alias] !== undefined && env[alias] !== ''
  if (hasDirect && hasPublic && direct !== publicValue) {
    throw new Error(name + ' and ' + alias + ' must agree.')
  }
  return hasDirect ? direct : publicValue
}

export function resolveSiteConfig(env = process.env, facts = defaultFacts) {
  return {
    siteUrl: validateSiteOrigin(env.NUXT_PUBLIC_SITE_URL || facts.defaultOrigin),
    indexable: booleanSetting(env, 'INDEXABLE', true),
    legalPublished: booleanSetting(env, 'LEGAL_PUBLISHED', false),
    demoEndpoint: String(env.NUXT_PUBLIC_DEMO_ENDPOINT || '').trim(),
    demoEmail: String(env.NUXT_PUBLIC_DEMO_EMAIL || '').trim(),
    facts,
  }
}

// Explicit env objects keep tests isolated. Normal CLI/Nuxt use also reads .env.
export function loadSiteConfig({ projectRoot = PROJECT_ROOT, env = process.env } = {}) {
  const envFile = join(projectRoot, '.env')
  if (env === process.env && existsSync(envFile)) process.loadEnvFile(envFile)
  const facts = JSON.parse(readFileSync(join(projectRoot, 'content/site.json'), 'utf8'))
  return resolveSiteConfig(env, facts)
}

export function canonicalUrl(path, siteUrl) {
  if (
    typeof path !== 'string' ||
    !path.startsWith('/') ||
    path.startsWith('//') ||
    /[\\?#\s]/.test(path)
  ) {
    throw new Error('Canonical paths must be rooted paths without a query, fragment or whitespace.')
  }
  return new URL(path, validateSiteOrigin(siteUrl)).href
}
