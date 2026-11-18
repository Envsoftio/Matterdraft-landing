# MatterDraft portal foundation

The product scope is user login, subscription management, device licensing and support tickets. Organisation membership and staff administration support those workflows. Product usage reporting, analytics dashboards, notification inboxes, campaigns and incident management are outside scope; see `PRD_CUSTOMER_AND_ADMIN_BACKEND.md`. Subscription and licensing integrations are not implemented by the current foundation.

The customer account area supports verified sign-in, personal and organisation accounts, member invitations, role changes, ownership transfers, and an activity log. Staff access requires a verified account with an active staff role. The internal administration area lists organisations and can register the desktop app for sign-in.

## Local setup

1. Use Node from `package.json`, install with `npm ci`, and set the variables in `.env.example` in local `.env`. Keep `.env` out of Git.
2. Apply every unapplied migration with `npm run db:migrate` against the intended database.
3. Run `npm run dev` and open `http://localhost:3000/sign-up`.
4. Local account emails are saved as JSON in `.data/mail-preview/`. Open the verification URL from the latest preview. Configure `SMTP_HOST`, `SMTP_FROM`, and any needed SMTP credentials before production use; local preview files are not a delivery mechanism.
5. Sign in and verify the account email. Grant the initial super-admin capability with `npm run staff:grant-access -- user@example.com "Initial administrator bootstrap"`. This command changes the configured database and records an audit event; check its target before running it. Staff API routes check the active staff role on every request.
6. A super admin can register the first-party desktop OAuth client from the internal overview. Copy its public client ID and exact redirect URI into the desktop application configuration.

## Super Admin Dashboard

The dashboard at `/internal/overview` shows solo and firm account activity, tickets needing a response, and the service checks. Apply `0005_service_failure_counts.sql` before deploying it. Failure counts include API responses observed by Nitro when Turso is reachable. Use production monitoring for hosting outages and database downtime.

## Desktop authorization contract

The desktop app must register and handle `legal.matterdraft.studio:/oauth/callback` as a private-use URL scheme. It opens the system browser to the server's OAuth authorization endpoint and uses Authorization Code with PKCE `S256`. Generate a fresh verifier, challenge, and unpredictable `state` for each attempt. Use the registered public client ID; do not ship a client secret. On callback, verify `state`, exchange the code with the original verifier, and store tokens in the operating system's secure credential store. The portal does not receive local matter or document content.

The authorization server's public metadata and a full native round trip must be checked against the desktop application before release. The web portal alone cannot verify OS scheme registration or token storage.

## Deployment prerequisites

- Netlify must receive `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `BETTER_AUTH_URL` (the exact HTTPS portal origin), `BETTER_AUTH_SECRET`, and production SMTP settings as server environment variables. Use separate database and secrets for deploy previews. Never use the local development `.env` in Netlify.
- Netlify uses `npm run build` with the Nitro `netlify` preset. The preset writes public files to `dist` and generates the server function for the portal and its API routes.
- Run migrations against each target database before its release. Arrange database backups and restore verification before accepting production accounts.
- The callback scheme in `DESKTOP_REDIRECT_URI` must match the desktop handler exactly. Changing it requires a new client registration and desktop release.
- Review dependency advisories and the remaining manual checks before production launch. Local query, error-contract and opt-in route/browser checks exist; the release still needs the deployment, SMTP and native desktop checks listed below.
- Rotate the existing early access Google Apps Script shared secret before deployment. Its old value was present in the tracked `.env.example`; the local value has been moved to ignored `.env`.

## Organisation membership slice (local verification)

Apply `drizzle/0001_eager_luke_cage.sql`, `drizzle/0002_known_eternity.sql` and `drizzle/0003_loose_mastermind.sql` with `npm run db:migrate` against the intended database before using these routes. The first adds invitations; the second renames application-owned records and columns without discarding existing accounts, memberships, invitations, or activity. The third removes the unused two-factor table and user flag after the product decision to use verified individual staff accounts without MFA. These migrations have not been applied to the hosted database by this change. Keep `BETTER_AUTH_URL` set to the browser origin so invitation links work. SMTP is required for invitation delivery in production. In local development, invitation emails are saved under `.data/mail-preview/` with restricted file permissions.

Signed-in verified users can create an organisation from `/portal`. The organisation owner or admin can use `/a/:accountId/members` to invite, revoke, manage roles, or remove members according to their role. Owners can request transfer to an existing verified non-owner member. The recipient opens `/invite/:token`, signs in with the exact verified invited email, and accepts. The recipient must have a session created within ten minutes for ownership acceptance; the initiating owner also needs a recent session. The transfer makes the recipient owner and the initiator admin. Activity is visible at `/a/:accountId/activity`; super admins can see the organisation list at `/internal/organisations`.

Membership acceptance does not create a subscription, entitlement, device assignment, or document permission. Invitation links expire after seven days. Revoke an invitation and submit a new one to reissue it. If email delivery fails after the invitation is saved, the members screen reports that state; revoke and reissue after SMTP recovers.

### Local browser verification, 18 November 2026

Used `http://127.0.0.1:3011` with disposable, email-verified users and `.data/matterdraft-membership-check.db`. Verification links and invitations were read from local mail previews; no external email was sent. The browser confirmed organisation creation; member invitation; duplicate-invitation rejection; invited-email binding; repeated member acceptance with one membership; member and unrelated-user access denial; owner role changes from member to billing manager to admin; admin-only member invitation; admin self-removal denial; last-owner removal denial; revoked and expired invitation rejection; ownership transfer after fresh sign-in; repeated transfer acceptance returning `accepted`; the recipient as owner and initiator as admin; and transfer entries in the activity log. The invitation page now refreshes portal context after acceptance, and transfer validation accepts Better Auth's generated user IDs.

The local schema has no paid-device, entitlement, or subscription tables, and no acceptance route writes a device assignment. This is a code and local-database check, not a production entitlement check.

### Naming migration, 18 November 2026

Applied `0002_known_eternity.sql` only to `.data/matterdraft-membership-check.db` after saving a local copy. The account, membership, invitation, and activity row counts remained 5, 6, 4, and 10. All 10 earlier activity entries were linked to their organisation, and `PRAGMA foreign_key_check` returned no violations. A second disposable database copy with a plain-text staff audit entry also migrated cleanly; the staff entry kept a null organisation link. Drizzle reports no further schema changes. The historical `0000` and `0001` files remain intact because they may already have been applied elsewhere. Drizzle's generated SQL contained an unsupported SQLite `ALTER COLUMN` and attempted to read a new column before creating it, so `0002` was replaced with reviewed rename and index statements before the local migration.

After this migration, two new disposable users were verified and signed in through Chrome and Brave. The browser confirmed organisation creation, member invitation, acceptance by the invited verified email, an accepted invitation on reload, member access denial to the management page, role changes from member to billing manager to admin, rejection of the last owner's removal, ownership transfer after a fresh recipient sign-in, the recipient as owner and the previous owner as admin, an accepted transfer on reload, and the corresponding activity entries. The earlier checks above covered a repeated acceptance request to the server; after this migration, repeat acceptance was checked only by reloading the accepted invitation page. See the end-to-end section below for checks completed after that pass and the remaining deployment/native work.

The gaps recorded at the end of that earlier pass are superseded by the scoped local evidence in [End-to-end login and support verification](#end-to-end-login-and-support-verification-18-november-2026). Local concurrent acceptance, stale transfer sessions, last-owner demotion, forged roles, peer-admin denial, keyboard and mobile checks now have evidence. SMTP delivery and hosted Turso remain unverified.

### Dependency advisory status, 18 November 2026

The initial `npm audit` reported 47 entries (43 high, 4 moderate). The high entries are dependency-chain effects of [`picomatch` ReDoS GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf): the lockfile contains `picomatch` 4.0.7 and 2.3.2, and npm still lists 4.0.7 as the latest release. The advisory lists no patched version. The moderate chain was [`esbuild` GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99): `drizzle-kit` 0.31.11 still declares `@esbuild-kit/esm-loader`, whose `@esbuild-kit/core-utils` resolved `esbuild` 0.18.20. Drizzle Kit 0.31.11 is the latest published release; [the upstream loader issue](https://github.com/drizzle-team/drizzle-orm/issues/5304) remains open. The scoped local override described below addresses the moderate chain without downgrading Drizzle Kit.

### Dependency refresh, 18 November 2026

Updated the direct dependencies to npm's latest stable releases where they work with this application: `@tailwindcss/vite` and `tailwindcss` 4.3.5, `marked` 18.2.1, and `vue` 3.5.45. `npm outdated` now lists only TypeScript. TypeScript 7.0.2 was installed and tried, but `npm run typecheck` failed because the latest `vue-tsc` 3.3.14 loads `typescript/lib/tsc`, which TypeScript 7 does not export. TypeScript remains at the latest working 6.x release, 6.0.3. [Vue Language Tools tracks this incompatibility](https://github.com/vuejs/language-tools/issues/6156). Recheck TypeScript and Vue tooling together after upstream support lands; avoid bypassing the typecheck to make the version number look current.

After the compatible updates, a scoped `package.json` override moves only `@esbuild-kit/core-utils` from vulnerable `esbuild` 0.18.20 to patched 0.25.12. `npm ls` confirms the nested version; Drizzle migration generation and local migration, Nuxt typecheck, and production build pass. The final audit has 43 high dependency-chain entries from one `picomatch` advisory and no moderate entries; `npm audit --omit=dev` reports the same 43. npm still lists `picomatch` 4.0.7, `drizzle-kit` 0.31.11, and `vue-tsc` 3.3.14 as latest. Remove the override when Drizzle Kit drops its deprecated loader. No `npm audit fix --force` was used. Hosted migration, native desktop sign-in and SMTP delivery remain outstanding. The later end-to-end section records local membership and browser verification; dependency advisories were not re-audited during that pass.

## Application errors and runtime logs

Application-owned `/api/portal`, `/api/accounts`, `/api/membership`, and `/api/internal` failures use `{ "error": { "code", "message", "requestId", "retryable" } }` with the corresponding HTTP status and `X-Request-Id` response header. The request ID is generated by the handler, not accepted from a caller. Better Auth's `/api/auth/**` OAuth and session protocol responses remain vendor-owned. Structured runtime error entries go to function stdout/stderr; audit events remain in the database. Logs contain route templates, not request URLs, bodies, cookies, headers, tokens, SQL text, or account identifiers. Configure restricted access and retention for Netlify function logs before launch.

`/maintenance.html` is a static asset in the published Netlify directory. It is reachable when the CDN can serve static files even if the Nitro function or database fails. It is not an automatic replacement for failed SSR/API requests. A failure before the Nitro handler starts, a Netlify platform failure, or DNS/TLS/CDN outage may bypass both the application logger and this page. Monitor Netlify separately and check the published static path from a deploy preview. Application SSR errors rendered by `app/error.vue` show only safe text; a platform-generated error or a failure outside application-owned routes can still require provider-level handling.

Before release, check 401, 403/404, 409, 422, 429, 500, and database 503 responses against server logs in a deploy preview. Confirm the `X-Request-Id`, JSON `requestId`, and log `requestId` match, and inspect browser HTML/payloads for stack or secret leakage. Exercise a failed SSR request and a static `/maintenance.html` request with the function unavailable. Repeat the handler checks in a deploy preview. Netlify pre-handler and function-outage behavior requires that deployment; local checks cannot establish it.

### Local error check, 18 November 2026

`npm run typecheck`, `npm run build`, and `node --test tests/application-error.test.mjs` passed. A built Nitro server with a deliberately unreachable HTTPS database URL returned a 401 JSON envelope for `/api/portal/context`; its `X-Request-Id` matched the structured server log. An unknown public URL rendered the safe Nuxt 404 page, and `/maintenance.html` returned a static 200. The libSQL production path uses the web client and Drizzle's web driver so a remote Turso deployment does not load the local native SQLite binary before the handler. Local `file:` development still uses the native client. A production build run with a local `file:` URL is not supported by the packaged server; use a hosted or test HTTP/libSQL URL for deploy-preview checks.

Those earlier error checks alone did not complete membership or desktop verification. The end-to-end section below supplies additional local membership, support and browser evidence. Real SMTP, hosted Turso and the native OAuth round trip still require their own environments. Billing awaits provider, tax, and commercial choices; licensing follows its separately approved contract.

## Internal customer directory

The internal Customers page lists registered users with bounded name/email search and 25-row pagination. A detail page shows verified-email status and current account memberships. Both API routes require a verified super admin; the directory and detail reads create fixed-text audit events. They do not expose auth credentials, payment details, device state, matter content, or invitation tokens. The UI does not imply that billing or licensing data exists.

`node --test tests/customer-directory.test.mjs` exercises filtering, parameter safety, membership counts and pagination against a disposable in-memory SQLite database. Before release, check the 401/403 boundary and audit entries through a signed-in browser against a deploy preview, including a user without staff access. The current search uses SQLite `lower` and `instr`; non-ASCII case folding may require a dedicated indexed search strategy if customer names need it. Large directories will also need indexed search before this table grows substantially.

## Internal organisation inspection

The Organisations page supports bounded name search and 25-row pagination. A detail page shows current members and the 100 most recent open invitations, including expired pending invitations and ownership-transfer purpose. No invitation token or token hash is returned. Member names link to the internal customer directory. Both API routes require a verified account with an active super-admin role and audit each successful read. The former unpaginated organisation route was removed.

`node --test tests/organisation-directory.test.mjs` checks query scoping, search, pagination, expired invitations and token omission against a disposable in-memory database. Before release, verify 401/403 responses, staff audit entries and mobile layout in a browser against a deploy preview. The new `0003` migration was applied to a disposable copy of the local membership database: the two-factor table and user flag were removed, user/account/membership counts remained 6/8/10, and `PRAGMA foreign_key_check` returned no violations. The original local database was not changed.

## Support conversations, 18 November 2026

Apply `drizzle/0004_elite_preak.sql` to each target database before deploying the support routes. It adds account-scoped `support_ticket` and `support_message` records without attachments or documents; the earlier migrations are unchanged. The migration applied successfully to a disposable local database at `/private/tmp/matterdraft-support-check-20261118.db`. It has **not** been applied to the hosted database.

Verified customers use `/a/:accountId/tickets` to create and view only tickets they created for that account. Every customer request checks current account membership; detail and reply queries also check the creator. Categories are question, bug, billing and feedback. JSON request bodies are capped at 48 KiB; subject length is at most 120 characters and message length is at most 10,000. Vue renders both as text. Ticket and reply submissions carry a client-generated UUID key so a retry after an uncertain response cannot create a second record. After an ambiguous response, the UI asks the user to check the ticket or conversation before retrying with the same key. Customers and staff can reply while a ticket is active; resolved and closed tickets have no reply form. Reopening policy and SLA targets remain undecided and are not promised in the UI.

Verified super admins use `/internal/tickets` to search by subject, account name or creator email, read conversations, reply and set any of the five PRD statuses: Open, Awaiting support, Awaiting customer, Resolved and Closed. Staff reads and writes create fixed-text audit events; runtime logs remain separate and contain no ticket text. Customer responses omit creator email, account name and staff submission keys. There are no staff notes, assignees, priority controls, email notifications or attachments in this slice.

`node --test tests/support.test.mjs` passed against disposable in-memory SQLite data. It checks account and peer-member denial, idempotent creation and replies, a simultaneous same-key submission, reply status behavior, all five status changes, bounded input, query parameter safety, customer response privacy and fixed-text audit records. A local Nuxt route check against the disposable migrated database confirmed that collection and detail endpoints return the shared 401 JSON envelope and matching `X-Request-Id` when unauthenticated. `npm run typecheck` and `npm run build` passed. These checks do not replace an authenticated browser review of forms, keyboard access, account switching, staff role revocation, and mobile layout on a deploy preview.

Before release, run `0004` on the hosted and preview databases, verify 401/403/404 and redacted 5xx responses with restricted function logs, confirm staff read/write audits, test concurrent submissions on hosted libSQL, and inspect customer and staff screens at mobile width. Use the end-to-end section below for the current local membership evidence; deployment and native desktop checks remain open. Billing still waits for provider, tax and commercial decisions; licensing follows its separately approved contract.


## End-to-end login and support verification, 18 November 2026

This section is the current local verification record and supersedes earlier statements that these local checks had not yet run. It does **not** mark any hosted migration, deploy-preview, SMTP or native desktop check passed. Subscription integration still awaits provider, tax and commercial decisions. Device licensing still awaits an approved operational contract and verification in the separate native application; no checkout, trial grant, licence, activation or device transfer was added.

### Environment and reproducible commands

Used Node 26.8.1, Nuxt 4.6.4, Better Auth 1.7.25 and headless Google Chrome 157.0.8103.80, with a fresh browser context per synthetic `@example.test` identity. All five migrations were applied to `/private/tmp/matterdraft-portal-e2e/check.db`. The server listened only at `http://127.0.0.1:3012`. The existing `.env` was not loaded by that server; SMTP and the Turso token were explicitly cleared. Verification, recovery and invitation links came from restricted local mail-preview files. Staff access and stale/unverified sessions were fixtures in that disposable database. No external email was sent and no hosted data was changed.

Exact setup commands (the `local-only` migration token satisfies Drizzle Kit's Turso configuration validator; it is not a hosted credential):

```sh
mkdir -p /private/tmp/matterdraft-portal-e2e
touch /private/tmp/matterdraft-portal-e2e/empty.env
TURSO_DATABASE_URL=file:/private/tmp/matterdraft-portal-e2e/check.db TURSO_AUTH_TOKEN=local-only npm run db:migrate
TURSO_DATABASE_URL=file:/private/tmp/matterdraft-portal-e2e/check.db TURSO_AUTH_TOKEN= BETTER_AUTH_URL=http://127.0.0.1:3012 BETTER_AUTH_SECRET=local-disposable-verification-secret-20261118 SMTP_HOST= SMTP_USER= SMTP_PASSWORD= SMTP_FROM= node node_modules/nuxt/bin/nuxt.mjs dev --host 127.0.0.1 --port 3012 --dotenv /private/tmp/matterdraft-portal-e2e/empty.env > /private/tmp/matterdraft-portal-e2e/server.log 2>&1
```

In another terminal, ran the opt-in [verification harness](../scripts/verify-portal.mjs). Playwright was already available in the machine's Codex runtime; no application dependency was added. On another machine, set `PLAYWRIGHT_MODULE_PATH` and `CHROME_EXECUTABLE` to its installed equivalents, or let the harness import an available `playwright` package and launch its Chromium. The harness deliberately accepts only loopback URLs and a `/private/tmp/*.db` database. Start the isolated server above first: it creates synthetic users and temporarily renames a support table to test a real query failure, then restores it in `finally`.

```sh
PORTAL_CHECK_DATABASE=file:/private/tmp/matterdraft-portal-e2e/check.db PORTAL_CHECK_LOG=/private/tmp/matterdraft-portal-e2e/server.log PLAYWRIGHT_MODULE_PATH=/Users/vishnu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs CHROME_EXECUTABLE='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' node scripts/verify-portal.mjs > /private/tmp/matterdraft-portal-e2e/results.log 2>&1
```

### Confirmed defects and changes

- Recovery and verification-resend forms ignored returned auth failures and could show false success; reset and sign-out paths also lacked consistent failure cleanup. They now check results, show accessible safe errors and clear busy state in `finally`. Successful sign-out clears cached Nuxt data; a failed sign-out does not claim the session ended.
- Failed `useFetch().refresh()` calls set an error ref rather than necessarily throwing. Ticket/reply, invitation and account reconciliation could therefore enable actions after a failed read. Actions now remain blocked until a successful read. An uncertain ticket/reply retains its submission key and payload; fields are locked while its result is uncertain. Ticket creation also captures its original account and avoids redirecting over a later navigation.
- Support POST/PATCH routes lacked the explicit origin check used by membership mutations. The shared support-input reader now rejects missing or foreign origins before reading JSON. Direct customer and staff mutation tests cover these denials.
- The members grid's minimum content width expanded the page beyond 390 px. A zero-minimum grid child now keeps the table's horizontal scrolling inside its container.
- Off-screen mobile navigation remained keyboard-focusable, and the hand-built member dialog lacked focus containment, Escape handling and focus return. Closed navigation is now inert, open mobile navigation traps focus and restores it on Escape, and the member dialog uses the existing Reka primitives. Dialog errors are visible and announced inside it.
- Locale-dependent date strings differed between SSR and the browser. Hydration warnings included invitation URLs in development logs. Portal dates now use Nuxt's hydration-aware `NuxtTime`, preserving local formatting without those warnings. Failed invitation loads also use the safe error parser instead of incorrectly claiming every failure means the wrong email.

No schema change or new migration was needed. Existing migrations and application-owned record names were preserved. Audit records remain in the database, separate from runtime logs.

### Verification evidence

The harness completed **13 verification groups** through real routes and rendered UI:

| Area | Local evidence |
| --- | --- |
| Login | Browser sign-up, local verification/resend, keyboard sign-in, password recovery/reset and single-use reset token, non-enumerating absent-user recovery, sign-out and subsequent 401. Unverified sign-in and an existing session whose user became unverified are denied. Failed recovery/resend/reset/sign-out responses show errors without false success. |
| Membership | Browser organisation creation, invitation, exact-email acceptance, role changes to billing manager/admin and ownership acceptance. Direct API tests cover wrong-email GET/POST, expired/revoked invitations, stale transfer initiator/recipient sessions, last-owner removal/demotion, member restrictions, forged owner/admin/billing-manager invitations and peer-admin changes. Removed members lose overview, member and ticket access. |
| Concurrency | Two pending invitation-creation requests leave one pending invitation; two concurrent acceptances of a pending invitation leave one membership. Ticket and reply requests with the same key return the same record ID; changed payload with the same key conflicts. These are concurrent HTTP requests to one local Nitro process, not proof of hosted multi-instance behavior. |
| Customer support | Browser create/read/reply; literal HTML is displayed as text. Another account, an unrelated user, a peer member and a removed member cannot read/reply to another creator's ticket; peer lists omit it. Invalid JSON, oversized input and missing/foreign mutation origins are rejected. |
| Staff support | Browser list/read/reply/status, all five statuses through the API, fixed-text read/write audit events, and closed-ticket reply denial. Every tested internal endpoint rejects absent/revoked super-admin access; an active support-operator role and an unverified staff user are also denied. Revocation is checked in an existing browser session and direct mutation requests. |
| Privacy and errors | Customer JSON omits staff metadata and staff submission keys. Peer/revoked-staff browser responses omit ticket text. Actual query failure returns safe 503; tested 400/401/403/404/409/422/429/503 responses have matching header, body and structured-log request IDs. Captured logs from the final run contain no synthetic ticket-text sentinel, credential, invitation/auth token, SQL or hydration mismatch. Unexpected 500 behavior is covered by the error-contract unit tests, not an injected production crash. |
| Uncertain results | Browser interception forwards a real ticket/reply write, then substitutes 503 for its response. A subsequent failed reconciliation keeps submission blocked; successful reconciliation/retry with the original key leaves exactly one row. Auth failure responses are also intercepted; these are browser failure simulations, not SMTP or platform-outage tests. |
| Keyboard/mobile | 390 × 844 CSS-pixel checks cover auth, accounts, members, activity, customer/staff ticket list/conversation and staff directories; 1280 × 844 checks cover account menus/switching. Tab/Enter/Escape checks cover navigation containment, member-dialog focus/return, form submission and account switching. Account changes clear ticket drafts. Page-width assertions and screenshots were checked; member tables scroll internally. No uncaught browser errors; `PRAGMA foreign_key_check` returned no violations. |

The final run printed `Completed 13 verification groups`; its screenshots are in `/private/tmp/matterdraft-portal-7f1e1898`, and its output is `/private/tmp/matterdraft-portal-e2e/results.log`. These are temporary local artifacts, not committed release evidence. This is Chrome viewport emulation, not physical-phone, touch, screen-reader, cross-browser, full WCAG, production-performance or complete visual-regression certification. Screenshots of the members/dialog and customer/staff conversations were visually inspected in addition to automated width/focus assertions.

Final required checks and exact commands:

```sh
npm run test > /private/tmp/matterdraft-portal-e2e/test.log 2>&1
npm run typecheck > /private/tmp/matterdraft-portal-e2e/typecheck.log 2>&1
TURSO_DATABASE_URL=https://127.0.0.1:9 TURSO_AUTH_TOKEN=local-only BETTER_AUTH_URL=http://127.0.0.1:3012 BETTER_AUTH_SECRET=local-disposable-verification-secret-20261118 SMTP_HOST= SMTP_USER= SMTP_PASSWORD= SMTP_FROM= EARLY_ACCESS_GOOGLE_SHEETS_URL= EARLY_ACCESS_GOOGLE_SHEETS_SECRET= npm run build > /private/tmp/matterdraft-portal-e2e/build.log 2>&1
```

`npm run test`: **36/36 passed**. `npm run typecheck`: **passed**. `npm run build`: **passed**, with Vite warnings about public font paths left for runtime resolution and Nuxt console-timer warnings during concurrent prerendering. The font files are present under `.output/public/fonts`; those build warnings were not counted as browser or hosted verification. The build used an unreachable loopback database endpoint to ensure it could not contact hosted data; the browser suite used the local development server, not the packaged production server with `file:` SQLite. The existing early-access test intentionally logs a mocked webhook failure; it does not send a request to the real webhook.

### Checks still required before release

| Environment | Outstanding work — not passed locally |
| --- | --- |
| Netlify deploy preview, isolated secrets/database | Repeat authenticated login/membership/support and revocation checks over HTTPS; verify secure HttpOnly cookies, origin/CSRF behavior and rate limits through the proxy; inspect SSR HTML/payloads and restricted function logs; correlate all safe error statuses including real dependency/time-out failures. Test static `/maintenance.html` while the function is unavailable and failures before Nitro starts. Check cache isolation, deployed font requests, browser back/forward after sign-out and platform log access/retention. |
| Hosted preview Turso/libSQL | Apply all unapplied migrations after checking target history, verify foreign keys/data preservation, concurrent writes across independent connections/function instances, transaction/rollback behavior under latency/outage, backup and restore. No hosted schema or data was inspected or changed in this task. |
| Controlled SMTP/test-delivery environment | Verification/resend, reset and invitation delivery; expired links, provider failures/timeouts, sender configuration and production delivery recovery. Local preview JSON and intercepted browser errors do not prove SMTP delivery or saved-invitation email-failure behavior. |
| Separate native desktop app, supported operating systems | Register the public OAuth client; verify discovery metadata, external-browser Authorization Code + PKCE S256, state validation, exact private-scheme callback, code exchange/replay rejection, secure OS token storage and refresh/revocation. Portal sessions and local tests prove none of these native behaviors. |
| Product decisions plus provider/native sandboxes | Subscription provider, tax and commercial terms; approved licensing/trial/expiry/transfer/recovery contract; then billing authenticity/idempotency and native entitlement/device behavior. These integrations remain pending and their unavailable controls were not added. |
