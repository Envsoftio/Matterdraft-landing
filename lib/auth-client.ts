import { createAuthClient } from 'better-auth/vue'
import { oauthProviderClient } from '@better-auth/oauth-provider/client'

export const authClient = createAuthClient({
  plugins: [oauthProviderClient()],
})
