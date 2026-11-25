import { client } from './db'

// Keep in sync with desktop_account.rs and migration 0015_builtin_desktop_client.
export const builtInDesktopClientId = 'matterdraft-studio-desktop'

export function desktopRedirectUri() {
  return process.env.DESKTOP_REDIRECT_URI || 'legal.matterdraft.studio:/oauth/callback'
}

export async function isRegisteredDesktopClient(clientId: string) {
  const redirectUris = JSON.stringify([desktopRedirectUri()])
  // The provider serializes the redirect list, which the JSON column can wrap again.
  const { rows } = await client.execute({
    sql: `SELECT 1 FROM oauth_client c
      WHERE c.client_id = ? AND c.name = 'MatterDraft Studio Desktop' AND c.disabled = 0
        AND c.application_type = 'native' AND c.token_endpoint_auth_method = 'none'
        AND c.redirect_uris IN (?, ?)
        AND EXISTS (SELECT 1 FROM audit_event a WHERE a.event_type = 'oauth_client.register'
          AND a.subject_type = 'oauth_client' AND a.subject_id = c.client_id)`,
    args: [clientId, redirectUris, JSON.stringify(redirectUris)],
  })
  return rows.length > 0
}
