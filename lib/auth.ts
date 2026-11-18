import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { jwt } from 'better-auth/plugins'
import { oauthProvider } from '@better-auth/oauth-provider'
import { client, db } from './db'
import * as schema from './auth-schema'
import { sendAccountEmail } from './mail'

const baseURL = process.env.BETTER_AUTH_URL || 'http://localhost:3000'
if (process.env.NODE_ENV === 'production' && !process.env.BETTER_AUTH_SECRET) {
  throw new Error('BETTER_AUTH_SECRET is required in production')
}

export const auth = betterAuth({
  appName: 'MatterDraft Studio',
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [new URL(baseURL).origin],
  database: drizzleAdapter(db, { provider: 'sqlite', schema, transaction: true }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) =>
      sendAccountEmail(user.email, 'Reset your MatterDraft password', url),
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: false,
    sendVerificationEmail: async ({ user, url }) =>
      sendAccountEmail(user.email, 'Verify your MatterDraft email', url),
  },
  disabledPaths: ['/token'],
  plugins: [
    jwt({ disableSettingJwtHeader: true }),
    oauthProvider({
      loginPage: '/sign-in',
      consentPage: '/consent',
      signup: { page: '/sign-up' },
      clientPrivileges: async ({ user }) => {
        if (!user || !user.emailVerified) return false
        const record = await client.execute({
          sql: 'SELECT 1 FROM staff_access WHERE user_id = ? AND role = ? AND active = 1 LIMIT 1',
          args: [user.id, 'super_admin'],
        })
        return record.rows.length > 0
      },
    }),
  ],
})
