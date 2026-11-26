import { betterAuth } from 'better-auth'
import { APIError } from 'better-auth/api'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { jwt } from 'better-auth/plugins'
import { oauthProvider } from '@better-auth/oauth-provider'
import { client, db } from './db'
import { listDesktopTrialExpiries } from '../server/utils/licence-trials'
import { ensurePersonalAccount, listCustomerAccounts } from './customer-accounts'
import * as schema from './auth-schema'
import { sendAccountEmail } from './mail'
import { getStaffAccess } from './staff-access'
import { isRegisteredDesktopClient } from './registered-desktop-client'

const baseURL = process.env.BETTER_AUTH_URL || 'http://localhost:3000'
if (process.env.NODE_ENV === 'production' && !process.env.BETTER_AUTH_SECRET) {
  throw new Error('BETTER_AUTH_SECRET is required in production')
}

async function sendWelcomeEmail(user: { id: string; email: string }) {
  try {
    // Concurrent verification requests can both reach this hook. Only one claims delivery.
    const { rowsAffected } = await client.execute({
      sql: `INSERT INTO account_welcome_email (user_id, attempted_at) VALUES (?, ?)
            ON CONFLICT(user_id) DO NOTHING`,
      args: [user.id, Date.now()],
    })
    if (!rowsAffected) return

    await sendAccountEmail(user.email, new URL('/portal', baseURL).href, { kind: 'welcome' })
    await client.execute({
      sql: 'UPDATE account_welcome_email SET sent_at = ? WHERE user_id = ?',
      args: [Date.now(), user.id],
    })
  } catch {
    // Verification has already succeeded. Keep the claim if SMTP acceptance is uncertain.
    console.error('Could not complete MatterDraft welcome email delivery', { userId: user.id })
  }
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
      sendAccountEmail(user.email, url, { kind: 'password-reset' }),
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: false,
    sendVerificationEmail: async ({ user, url }) =>
      sendAccountEmail(user.email, url, { kind: 'verification' }),
    afterEmailVerification: sendWelcomeEmail,
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
      customUserInfoClaims: async ({ user, jwt, scopes }) => {
        const clientId = jwt.client_id ?? jwt.azp
        if (
          typeof clientId !== 'string' ||
          !scopes.includes('profile') ||
          !(await isRegisteredDesktopClient(clientId))
        )
          return {}
        await requireDesktopCustomer(user)
        const [accounts, trials] = await Promise.all([
          listCustomerAccounts(user.id),
          listDesktopTrialExpiries(client, user.id),
        ])
        return { matterdraft_accounts: accounts, matterdraft_trials: trials }
      },
      clientPrivileges: async ({ user }) => {
        if (!user || !user.emailVerified) return false
        const staff = await getStaffAccess(user.id)
        return staff?.active === true && staff.role === 'super_admin'
      },
    }),
  ],
})
