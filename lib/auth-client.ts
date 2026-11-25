import { createAuthClient } from 'better-auth/vue'
import { oauthProviderClient } from '@better-auth/oauth-provider/client'

export const authClient = createAuthClient({
  plugins: [oauthProviderClient()],
})

// The combined desktop form completes the signed continuation before opening the app.
export const desktopSignInClient = createAuthClient({
  disableDefaultFetchPlugins: true,
  plugins: [oauthProviderClient()],
})
