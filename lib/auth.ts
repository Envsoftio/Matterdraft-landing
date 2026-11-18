import { betterAuth } from 'better-auth'
import { APIError } from 'better-auth/api'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { jwt } from 'better-auth/plugins'
import { oauthProvider } from '@better-auth/oauth-provider'
import { db } from './db'
import { ensurePersonalAccount } from './customer-accounts'
import * as schema from './auth-schema'
import { sendAccountEmail } from './mail'
import { getStaffAccess } from './staff-access'

const baseURL = process.env.BETTER_AUTH_URL || 'http://localhost:3000'
if (process.env.NODE_ENV === 'production' && !process.env.BETTER_AUTH_SECRET) {
  throw new Error('BETTER_AUTH_SECRET is required in production')
}

async function requireDesktopCustomer(user?: { id: string; emailVerified: boolean } | null) {
  if (!user?.emailVerified || (await getStaffAccess(user.id))) {
    const message = 'Use a verified customer account to connect the desktop app.'
    throw new APIError('FORBIDDEN', {
      error: 'access_denied',
      error_description: message,
      message,
    })
  }
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
      postLogin: {
        page: '/consent',
        shouldRedirect: () => false,
        // Check both new authorization requests and requests resuming after consent.
        consentReferenceId: async ({ user }) => {
          await requireDesktopCustomer(user)
          return undefined
        },
      },
      customTokenResponseFields: async ({ user, grantType }) => {
        if (grantType === 'authorization_code' || grantType === 'refresh_token') {
          await requireDesktopCustomer(user)
          if (user && grantType === 'authorization_code') await ensurePersonalAccount(user)
        }
        return {}
      },
      clientPrivileges: async ({ user }) => {
        if (!user || !user.emailVerified) return false
        const staff = await getStaffAccess(user.id)
        return staff?.active === true && staff.role === 'super_admin'
      },
    }),
  ],
})
