-- The desktop app ships this public ID. Provision it in every portal database;
-- keep earlier registrations and their tokens intact for older desktop builds.
INSERT INTO oauth_client (
  id, client_id, name, application_type, token_endpoint_auth_method,
  redirect_uris, scopes, grant_types, response_types,
  require_pkce, skip_consent, disabled, created_at, updated_at
) VALUES (
  'matterdraft-studio-desktop', 'matterdraft-studio-desktop', 'MatterDraft Studio Desktop',
  'native', 'none',
  '["legal.matterdraft.studio:/oauth/callback"]',
  '["openid","profile","email","offline_access"]',
  '["authorization_code","refresh_token"]', '["code"]',
  1, 0, 0, unixepoch() * 1000, unixepoch() * 1000
);
--> statement-breakpoint
INSERT INTO audit_event (
  id, actor_user_id, event_type, subject_type, subject_id, event_detail, created_at
) VALUES (
  'builtin-desktop-client-registration', NULL, 'oauth_client.register', 'oauth_client',
  'matterdraft-studio-desktop',
  'Provisioned the built-in MatterDraft desktop public client through database migration 0015',
  unixepoch() * 1000
);
