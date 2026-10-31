import tailwindcss from '@tailwindcss/vite'
import { loadSiteConfig } from './scripts/site-config.mjs'

const settings = loadSiteConfig()

export default defineNuxtConfig({
  compatibilityDate: '2026-10-30',
  devtools: { enabled: false },
  telemetry: false,
  ssr: true,
  css: ['~/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] },
  typescript: { strict: true, typeCheck: false },
  sourcemap: { server: false, client: false },
  runtimeConfig: {
    public: {
      siteUrl: settings.siteUrl,
      indexable: settings.indexable,
      earlyAccessEnabled: settings.earlyAccessEnabled,
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'en-IN' },
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      meta: [
        { name: 'theme-color', content: '#071b37' },
        { name: 'color-scheme', content: 'light dark' },
        { name: 'format-detection', content: 'telephone=no' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
        { rel: 'preload', href: '/fonts/plus-jakarta-sans-latin-variable.woff2', as: 'font', type: 'font/woff2', crossorigin: '' },
      ],
      script: [{ src: '/theme-init.js' }],
    },
    pageTransition: { name: 'page', mode: 'out-in' },
  },
  features: { inlineStyles: false },
  experimental: { payloadExtraction: true },
  prerender: {
    crawlLinks: true,
    routes: ['/', '/privacy', '/terms', '/refund-policy'],
  },
  nitro: { prerender: { failOnError: true, concurrency: 4 } },
  routeRules: {
    '/**': { headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Link': '</llms.txt>; rel="describedby"',
    } },
    '/_nuxt/**': { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
    '/_nuxt/builds/latest.json': { headers: { 'Cache-Control': 'no-cache' } },
  },
})
