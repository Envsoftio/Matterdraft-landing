import type { Client } from '@libsql/client'
import { createClient as createWebClient } from '@libsql/client/web'
import { createRequire } from 'node:module'
import { drizzle } from 'drizzle-orm/libsql/web'
import * as authSchema from './auth-schema'

const url = process.env.TURSO_DATABASE_URL || (process.env.NODE_ENV === 'production' ? '' : 'file:.data/matterdraft-dev.db')
if (!url) throw new Error('TURSO_DATABASE_URL is required in production')
if (url.startsWith('libsql://') && !process.env.TURSO_AUTH_TOKEN) {
  throw new Error('TURSO_AUTH_TOKEN is required for the hosted database')
}

// The hosted Nitro function uses the HTTP client; loading the native client at module
// startup requires a platform binary that is not part of the Netlify function bundle.
const requireClient = createRequire(import.meta.url)
const createClient = url.startsWith('file:')
  ? (requireClient('@libsql/client') as typeof import('@libsql/client')).createClient
  : createWebClient
export const client: Client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN })
export const db = drizzle(client, { schema: authSchema })
