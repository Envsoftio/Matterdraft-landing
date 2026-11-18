import { defineConfig } from 'drizzle-kit'

if (process.env.NODE_ENV !== 'production' && !process.env.TURSO_DATABASE_URL) {
  process.loadEnvFile('.env')
}

export default defineConfig({
  schema: ['./lib/auth-schema.ts', './lib/customer-schema.ts'],
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  },
})
