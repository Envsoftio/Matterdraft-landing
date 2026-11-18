# MatterDraft Studio — Account, subscription, licensing and support PRD

**Updated:** 18 November 2026  
**Status:** Product scope; account and administration foundation in development  
**Related:** [Device licensing and pricing](PRD_DEVICE_LICENSING_AND_PRICING.md) · [UI/UX design prompt](PROMPT_BACKEND_PORTAL_UI_UX.md)

## 1. Product boundary

The customer portal provides user login, subscription management, device licensing, and support tickets. The desktop application owns document preparation and local matter files. Customer matter and document content stays in the desktop application.

The Super Admin Dashboard shows account creation, membership changes, support activity, and service health across solo advocate and law firm accounts. Service health uses on-demand database and desktop registration checks and hourly counts of API failures the application can record.

The application excludes desktop usage tracking, a notification inbox, marketing campaigns, bulk communications, product incident management, release management, general CRM features, and cloud document features.

The current architecture is Nuxt/Nitro, Better Auth, Turso and Netlify. Customer and staff experiences have separate, server-enforced permissions. A verified individual account and active staff role are required for staff access; MFA is not a current requirement.

The selected trial duration is seven days. ₹499 per device/month is a proposed launch price, not a charge currently offered. Provider, tax, refund, proration, enterprise terms, trial-start semantics, paid offline validity, transfer/recovery rules and expiry restrictions still require decisions. Do not present undecided terms as customer promises. Internet is required for sign-in and initial activation; permanently offline activation is outside v1.

## 2. Identity and accounts

A user can belong to multiple customer accounts. An account is personal or organisational. Membership is separate from subscription, device assignment and local document ownership. Show the selected account clearly. Check account membership and action permission on every customer API request; submitted account IDs and hidden UI controls are not authorisation.

| Role | Permitted scope |
|---|---|
| Personal owner | Own account, subscription, devices and own support tickets |
| Organisation owner | Subscription, membership, ownership transfer and authorised device administration |
| Organisation admin | Invitations, membership administration and device allocation when the licensing contract allows it; no ownership or billing authority by default |
| Billing manager | Subscription and billing details; no other member's private tickets or unrestricted device control by default |
| Member | Own assigned licence state and own support tickets |
| Super admin | Authorised administration of accounts, subscriptions, licences and tickets |

Organisation owners and authorised admins can invite, revoke and manage members. Invitation acceptance is bound to the verified invited identity and is idempotent; it does not buy or assign a licence. Prevent last-owner removal and privilege escalation. Ownership transfer requires verified acceptance and recent authentication. Removing a member must not delete local files. Keep audit events for sensitive staff reads and writes, membership and subscription changes, and licence overrides.

## 3. Customer application

Navigation is limited to Account, Subscription, Devices, Support and the profile/security actions needed for login. An organisation account may show Members and relevant account activity for authorised roles. Omit controls for features that do not exist; show a short truthful state where a necessary destination is pending.

- **Account and login:** registration, email verification, sign-in, password recovery, sign-out, account switching and session security. Use secure HttpOnly cookies, CSRF/origin protection, rate limits and non-enumerating recovery responses. Desktop browser-to-app sign-in uses a separately tested OAuth Authorization Code + PKCE handoff; portal cookies alone do not authenticate the desktop app.
- **Subscription:** current trial or paid state, plan, quantity, renewal/cancellation state, invoices and hosted payment management when provider data exists. Before checkout or a plan change, show provider-calculated total, tax, effective date and any adjustment. A checkout return does not prove payment or grant access.
- **Devices:** assigned devices and licence state, with dates and actions supplied by the approved licensing contract. Do not invent offline grace, transfer or expiry policy. Existing local matters must remain readable after licence expiry; the exact restricted actions need a separate decision.
- **Support:** create, list, read and reply to tickets. A customer sees only tickets they created, even when another user belongs to the same organisation. Show category, subject, conversation and status. Render customer text safely; do not accept documents or attachments in the first slice.

## 4. Subscription and licensing boundary

Subscription flow: plan and quantity selection → explicit price preview → hosted checkout → verified provider event → authoritative subscription state → licence entitlement update → customer confirmation. Verify provider signatures over the required original payload. Deduplicate and reconcile delayed or reordered events. Persist retryable work and do not grant paid access from a browser success URL.

Keep subscription, invoice/payment references, device assignments and entitlements distinct. Never expose provider secrets, payment instrument details or signing keys to the browser or desktop app. Licence APIs return state, permitted actions, expiry/check dates and reason codes. Implement licence rules only from the separately approved [licensing contract](PRD_DEVICE_LICENSING_AND_PRICING.md); its proposals are not automatically customer terms.

## 5. Support tickets

Ticket states are Open, Awaiting support, Awaiting customer, Resolved and Closed. Staff can list/search tickets, read conversations, reply and change status. Staff reads and writes are audited. Customer access is scoped to both an active account membership and ticket creator. Staff-only metadata must never appear in customer responses.

The first slice stores account, creator, category, subject, status, timestamps and customer/staff messages. Bound and validate input sizes. Do not store attachments, private staff notes, issues or incidents in this slice. Define any reopening rule and response target before advertising them. Ambiguous reply results must be reconciled or shown as uncertain so the UI does not encourage duplicate posts.

## 6. Errors, privacy and operations

Application-owned API failures use a stable HTTP status and `{ "error": { "code", "message", "requestId", "retryable" } }`. Give safe recovery guidance. If a mutation may have committed, check its state before offering a retry. Handle authentication, permission, validation, conflict, rate limit, dependency outage and network failure in accessible UI. Platform failures before the handler may bypass the application response.

Runtime logs contain generated request IDs, route templates, stable error codes, status, timing and sanitised exception information. Do not log request bodies, ticket text, passwords, tokens, payment details, document content or raw URLs. Audit events are separate from runtime logs. Restrict log access and retention. Use migrations for schema changes; do not rewrite migrations already applied to any environment. Keep production and preview databases and secrets separate.

## 7. Data model

Logical records: Better Auth managed identities/sessions, customer accounts, account memberships, organisation invitations and ownership transfers, staff access, subscription and payment references, device assignments and entitlements, support tickets and messages, audit events, and durable attempts for payment/licence operations where needed. Do not create product usage batches, rollups, consent analytics, notification inboxes, marketing jobs, issues or incidents for this product scope.

## 8. Acceptance gates

1. Verify registration, email verification, recovery, session revocation and the native desktop sign-in handoff without exposing credentials.
2. Deny cross-account and peer-member access to subscriptions, devices and tickets on server routes; test each role.
3. Verify invitation binding, retries/concurrency, last-owner protection and privilege escalation denial.
4. Verify payment authenticity, duplicate and reordered events, pending results and reconciliation with provider sandbox data before enabling billing.
5. Verify trial and device allocation/transfer concurrency, entitlement signatures, offline behavior and expiry against the approved licensing contract on supported desktop platforms.
6. Verify ticket privacy, status changes, duplicate/concurrent replies, input limits, safe rendering and staff audit records.
7. Verify accessible loading, empty, error and success states; safe error envelopes and redacted logs under outage and timeout checks.
8. Verify backups, secret isolation, migration safety and deployment configuration. No document content enters web service records.

## 9. Delivery order and open decisions

Complete account and permission foundations → support tickets → subscription integration after provider/tax/commercial decisions → device licensing against its approved contract → release checks. Existing membership and native desktop handoff checks remain open; a portal build does not complete desktop verification.

Open decisions: payment provider, tax/proration/refunds, enterprise pricing and entitlements, licensing enforcement and transfer/recovery, support reopening and response targets, production email delivery, and deployment/runtime verification. Keep unavailable actions out of customer screens until these decisions and integrations exist.
