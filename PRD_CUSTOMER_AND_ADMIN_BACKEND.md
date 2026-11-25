# MatterDraft Studio — Account, subscription, licensing and support PRD

**Updated:** 22 November 2026

**Status:** Product scope; account and administration foundation in development  
**Related:** [Device licensing and pricing](PRD_DEVICE_LICENSING_AND_PRICING.md) · [Billing, licensing and invoice architecture](ARCHITECTURE_BILLING_AND_LICENSING.md) · [UI/UX design prompt](PROMPT_BACKEND_PORTAL_UI_UX.md)

The [desktop onboarding and Apple Silicon pilot PRD](PRD_DESKTOP_ONBOARDING.md) covers signup through the first desktop export. Track its delivery in the [onboarding task list](TASKS_DESKTOP_ONBOARDING.md).

## 1. Product boundary

The customer portal provides user login, subscription management, device licensing, and support tickets. The desktop application owns document preparation and local matter files. Customer matter and document content stays in the desktop application.

The Super Admin Dashboard shows account creation, membership changes, support activity, and service health across solo advocate and law firm accounts. Service health uses on-demand database and desktop registration checks and hourly counts of API failures the application can record.

The application excludes desktop usage tracking, a notification inbox, outbound marketing campaigns, bulk communications, product incident management, release management, general CRM features, and cloud document features.

The current architecture is Nuxt/Nitro, Better Auth, Turso and Netlify. Customer and staff experiences have separate, server-enforced permissions. A verified individual account and active staff role are required for staff access; MFA is not a current requirement.

One named advocate receives full desktop access on up to two of their own computers. Individuals and firms buy the same licence. The agreed trial is seven days. The pilot design offers prepaid monthly and annual access, with ₹499 and ₹4,999 per advocate as prices to validate. The current portal stores monthly per-device prices and starts the trial in the portal. Checkout, signed desktop grants and invoice delivery are implementation work. The [licensing PRD](PRD_DEVICE_LICENSING_AND_PRICING.md) sets the policy and the [architecture](ARCHITECTURE_BILLING_AND_LICENSING.md) specifies its implementation.

## 2. Identity and accounts

A user can belong to multiple customer accounts. An account is personal or organisational. Membership, a paid seat, seat assignment, device registration and local document ownership are distinct. Portal-only administrators and billing staff need no desktop seat. Show the selected account clearly. Check account membership and action permission on every customer API request; submitted account IDs and hidden UI controls are not authorisation.

| Role | Permitted scope |
|---|---|
| Personal owner | Own account, subscription, devices and own support tickets |
| Organisation owner | Subscription, membership, ownership transfer and authorised device administration |
| Organisation admin | Invitations, membership administration, licence assignment, reassignment and device revocation. Purchases and invoices require a billing role |
| Billing manager | Subscription and billing details; no other member's private tickets or unrestricted device control by default |
| Member | Own assigned licence, own computers and recovery, own support tickets |
| Super admin | Authorised administration of accounts, subscriptions, licences and tickets |

Organisation owners and authorised admins can invite, revoke and manage members. Invitation acceptance is bound to the verified invited identity and is idempotent; it does not buy or assign a licence. Prevent last-owner removal and privilege escalation. Ownership transfer requires verified acceptance and recent authentication. Removing a member must not delete local files. Keep audit events for sensitive staff reads and writes, membership and subscription changes, and licence overrides.

## 3. Customer application

### Advocate workspace

After browser sign-in, open Home in the personal workspace when one exists. An advocate with only organisation memberships lands in their first organisation workspace. A link to a specific workspace or invitation keeps its destination. The header shows the current workspace and provides Home and Support, plus Plans & billing for billing roles. The workspace menu handles switching and opens Manage workspaces, where an advocate can choose to create an organisation.

Home gives the advocate one next step based on their access:

| State | Home |
|---|---|
| Eligible while portal trials are enabled | Offer **Start free trial** and explain that the seven days begin immediately. |
| Trial active | Show when access ends, including the timezone, and tell the advocate to open MatterDraft Studio on their computer and sign in with the same account. |
| Trial ended | Show that the trial ended and link billing users to available plans. |
| Trial unavailable or access handled by the firm | Explain where to sign in on desktop. For firm members, identify the organisation administrator as the first contact for access. |

The desktop onboarding target starts new trials at first activation. When that ships, Home directs eligible advocates to the desktop activation flow and continues to show expiry for existing trials.

Home links to **Download and install**, billing and support as permitted. Approved installers and package instructions are available inside the workspace to verified customers. Super Admins can see who requested each installer, its platform and version, and when the link was issued. Organisation owners and admins also see Members and Activity log in their organisation workspace. Documents and matter files are managed in the desktop app. The dashboard can show paid access and computer actions when it has verified access and device data.

### Firm management

| Role | Workspace management |
|---|---|
| Firm owner | See purchased, assigned and available licences, named assignments, invited members, shared renewal date and total, scheduled changes and recent invoices. Invite, assign a spare, reassign, buy more or reduce the next renewal quantity. A pending invitation shows separately from an assigned licence. |
| Organisation admin | See the roster, licence capacity, assignments and registered computers for the selected firm. Manage assignments and replacements. When all licences are in use, identify the owner or billing manager who can buy another. |
| Billing manager | See payer profile, committed quantity, service dates, renewal total, purchase history, invoices and credits. Can purchase, renew, request a reduction and correct future billing details. Assignment and device administration require the corresponding role. |

The desktop Licence screen links to its workspace in the portal. Display timestamps in local time with an explicit timezone on expiry and payment confirmations.

**Plans & billing.** Distinguish trial expiry, paid-through, manual renewal, and any future authorised debit. Show the final payable amount and tax, change in quantity, effective date, today’s amount and the full next renewal price before confirmation. Example for a fourth licence halfway through a three-licence month: **₹249.50 today · ₹1,996 at next renewal**. After checkout show confirmed, confirming or failed status and a safe payment reference. A customer with a pending payment can check its progress. A lapsed customer can retrieve past invoices and renew.

**Offers and referrals.** Under Plans & billing show eligible published offers, the applicable saving, amount due and next regular renewal price. Personal buyers can apply a referral code before their first purchase. Eligible advocates can copy their own link or code and see each reward amount, status (pending, available, used or reversed), release date and available balance. Offer the available credit during manual personal renewal and show the resulting payable amount. Keep the referred buyer’s identity, payment details and invoices private.

**Invoices.** Show invoice number, issue date, billed-to name, covered dates, amount, payment status and linked credits. Offer a private PDF download and a support action referencing the invoice. Preview billing name, address/state, email and GSTIN where applicable before checkout. Explain that edits apply to future invoices. If generation is pending, show that state beside the confirmed payment. The architecture specifies line items, corrections and download authorisation.

**Computers.** Show device label, holder, registration time, last online verification, and next required check when available. Require fresh verification for a new installation or replacement. Explain the offline delay when removing a computer. A signing or connectivity outage should show the last known verification and a recovery action.

**Account and login.** Keep registration, email verification, sign-in, recovery, sign-out, account switching and session security. Use secure HttpOnly cookies, CSRF/origin checks, rate limits and non-enumerating recovery responses. Test the native system-browser OAuth Authorization Code + PKCE handoff separately.

- **Support:** create, list, read and reply to tickets. A customer sees only tickets they created, even when another user belongs to the same organisation. Show category, subject, conversation and status. Render customer text safely; do not accept documents or attachments in the first slice.

### MatterDraft staff dashboard

Extend the internal Overview and existing account detail screens. Access requires an active authorised staff role. The v1 commercial operations below belong to the super admin. Existing support-only or billing-only role names carry no implicit entitlement to these controls.

| View | Decisions and actions |
|---|---|
| Overview | Filter by date and individual or firm. Show trials started, trial purchases, first monthly renewals against eligible accounts, current paid accounts and licence quantities. Report captured INR, tax and confirmed refunds separately. Define counts from account and billing records. Link pending payments, invoices awaiting issue and repeated device replacements to the relevant account. |
| Account and licence detail | Search by customer, firm, invoice or payment reference. Show subscription, term, price version or firm agreement, quantities, assignments, computer registrations and recent changes. Authorised staff can review a recovery, revoke a registration or resolve a failed transfer with a reason. Keep the action and its previous/new state in the audit trail. |
| Billing and invoice operations | Inspect quote, payment, refund and invoice together. Reconcile a delayed provider payment, retry delivery or PDF generation, and initiate a policy-authorised refund or correction with confirmation. Preserve the original invoice and show the linked adjustment to the purchaser. Staff cannot mark an unverified checkout as paid. |
| Plans and firm contracts | Publish a versioned monthly or annual licence price or prepare a dated firm quote. Show unit price, quantity, one-off services, tax and renewal total before buyer acceptance. Historical terms and invoices retain their purchase values. |

Within commercial administration provide three destinations:

- **Plans.** Extend the existing plan editor with monthly and annual per-advocate prices, audience, effective date, preview, publish and archive. Price changes create a new version. Show the effect on future renewals and preserve purchased terms.
- **Offers.** Create a draft, define fixed INR saving, eligible plan, term, audience, purchase type, dates and redemption limit. Preview the customer price and regular renewal. Publish immediately or schedule, pause new redemptions, and inspect reserved and redeemed counts.
- **Referrals.** Configure versioned programme terms and the pilot budget. Preview buyer and referrer amounts together before publishing. Show reserved, committed and remaining budget, qualified paid referrals, credits pending, available, used or reversed, and regular-price renewal rate among referred buyers due to renew. Report promotion cost per retained buyer with its cost basis and cohort dates. Restrict publication, pausing and adjustments to an active super admin and audit each change. Existing promises retain their accepted terms.

## 4. Subscription and licensing boundary

Subscription flow: plan and quantity selection → explicit price preview → hosted checkout → verified provider event → authoritative subscription state → licence entitlement update → customer confirmation. Verify provider signatures over the required original payload. Deduplicate and reconcile delayed or reordered events. Persist retryable work and do not grant paid access from a browser success URL.

The proposed first payment flow is a prepaid month or year through hosted checkout. Optional AutoPay follows once renewal and seat changes are verified. An authorised admin can assign an existing paid seat. An authorised billing user can buy an extra seat prorated to the shared renewal date or reduce the quantity at renewal. Show the immediate charge and next renewal total before confirmation. Apply a paid increase only after verifying the provider's payment state. Reassignment of a paid seat does not change the quantity or charge. If AutoPay is enabled, collect any required fresh authorisation before changing the recurring amount.

Keep the paid quantity, named seat assignments, device registrations, signed entitlements and invoice/payment references distinct. Never expose provider secrets, payment instrument details or signing keys to the browser or desktop app. Licence APIs return state, permitted actions, expiry/check dates and reason codes. Use the [licensing contract](PRD_DEVICE_LICENSING_AND_PRICING.md) and its pilot parameters for verification.

## 5. Support tickets

Ticket states are Open, Awaiting support, Awaiting customer, Resolved and Closed. Staff can list/search tickets, read conversations, reply and change status. Staff reads and writes are audited. Customer access is scoped to both an active account membership and ticket creator. Staff-only metadata must never appear in customer responses.

The first slice stores account, creator, category, subject, status, timestamps and customer/staff messages. Bound and validate input sizes. Do not store attachments, private staff notes, issues or incidents in this slice. Define any reopening rule and response target before advertising them. Ambiguous reply results must be reconciled or shown as uncertain so the UI does not encourage duplicate posts.

## 6. Errors, privacy and operations

Application-owned API failures use a stable HTTP status and `{ "error": { "code", "message", "requestId", "retryable" } }`. Give safe recovery guidance. If a mutation may have committed, check its state before offering a retry. Handle authentication, permission, validation, conflict, rate limit, dependency outage and network failure in accessible UI. Platform failures before the handler may bypass the application response.

Runtime logs contain generated request IDs, route templates, stable error codes, status, timing and sanitised exception information. Do not log request bodies, ticket text, passwords, tokens, payment details, document content or raw URLs. Audit events are separate from runtime logs. Restrict log access and retention. Use migrations for schema changes; do not rewrite migrations already applied to any environment. Keep production and preview databases and secrets separate.

## 7. Data model

Logical records: Better Auth managed identities/sessions, customer accounts, account memberships, organisation invitations and ownership transfers, staff access, subscriptions and payment references, paid quantities, seat assignments, device registrations and entitlements, support tickets and messages, audit events, and durable attempts for payment/licence operations where needed. Evolve the existing per-device catalogue through a new migration. Do not create product usage batches, rollups, consent analytics, notification inboxes, marketing jobs, issues or incidents for this product scope.

## 8. Acceptance gates

1. Verify registration, email verification, recovery, session revocation and the native desktop sign-in handoff without exposing credentials.
2. Deny cross-account and peer-member access to subscriptions, devices and tickets on server routes; test each role.
3. Verify invitation binding, retries/concurrency, last-owner protection and privilege escalation denial.
4. Verify payment authenticity, duplicate and reordered events, pending results and reconciliation with provider sandbox data before enabling billing. Verify prepaid renewal, immediate and renewal totals for prorated additions, and reductions that take effect at renewal.
5. Verify trial and seat assignment, concurrent device registration and replacement, entitlement signatures, offline behavior and expiry against the approved licensing contract on supported desktop platforms.
6. Verify ticket privacy, status changes, duplicate/concurrent replies, input limits, safe rendering and staff audit records.
7. Verify accessible loading, empty, error and success states; safe error envelopes and redacted logs under outage and timeout checks.
8. Verify backups, secret isolation, migration safety and deployment configuration. No document content enters web service records.
9. Verify direct invoice downloads for personal, firm, former and unauthorised members, past invoices after expiry, immutable billing snapshots and credit-note links. A retry after delayed payment or PDF generation yields one purchase and one invoice.
10. Verify a personal licence moves into a firm with its remaining value and computer registrations intact, and the original personal invoices remain private. Check both dashboards against the same reconciled purchase.

11. Check referral eligibility, offer precedence, credit privacy and programme pause across all roles. Verify the approved ₹100 buyer discount and ₹100 renewal credit in the quote, invoice, reward history and super-admin budget.

## 9. Delivery order and open decisions

Complete account and permission foundations → support tickets → subscription integration after provider/tax/commercial decisions → device licensing against its approved contract → release checks. Existing membership and native desktop handoff checks remain open; a portal build does not complete desktop verification.

Before enabling paid use, confirm final pilot prices, provider and merchant tax configuration, refund and dispute policy, invoice corrections and retention, proration rounding, enterprise discount authority, the pilot offline limit and replacement-review thresholds. Support reopening, response targets, production email and hosted/native verification remain open. Delivery order, migration safeguards and billing failure tests are specified in the [architecture](ARCHITECTURE_BILLING_AND_LICENSING.md).
