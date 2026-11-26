# MatterDraft Studio — Advocate licensing and pricing PRD

**Status:** One named advocate per paid licence, full desktop access, two personal computers and a seven-day trial are agreed. Prepaid monthly and annual terms are the pilot design. Prices and the paid offline window require validation before publication.

**Updated:** 22 November 2026

**Scope:** Initial India offering for MatterDraft Studio

**Related architecture:** [Billing, licensing and invoice architecture](ARCHITECTURE_BILLING_AND_LICENSING.md).

**Related specification:** [Account, subscription, licensing and support PRD](PRD_CUSTOMER_AND_ADMIN_BACKEND.md). Internet is required for sign-in and initial activation. Permanently offline activation and manual licence files are outside v1. Product usage reporting and analytics are outside the web application's scope.

## 1. Who buys a licence

**One advocate, one licence, full access.** An advocate can use every available desktop feature on up to two of their own computers. A second advocate who uses the app needs a separate licence. A recipient can open a finished PDF without a MatterDraft account. The portal uses “licences” for customers and “computers” for registered installations.

| Customer | Offer to test |
|---|---|
| Independent advocate | Solo includes an office computer and a laptop for ₹499 per month including GST. ₹4,999 for one year was an earlier pilot proposal. |
| Chamber or firm | One account, bill and renewal date for all purchased licences. A firm with twenty advocates can start with two licences when two advocates use the app. Portal-only administration is free. |
| Large firm | Quote a committed annual licence count, unit price and renewal terms. Itemise any agreed onboarding or priority support separately. Validate support cost and retention before offering volume discounts. |

The portal uses ₹499 per month as the Solo base price for prepaid terms. At the default 15% discount, twelve months cost ₹5,089.80 including GST. Confirm provider fees before live collection. As an illustration, if 18% GST applies and the provider charges 2% plus GST on that fee, ₹499 leaves about ₹411 per paid month and ₹4,999 leaves about ₹343 per month before support, hosting, refunds and acquisition. The earlier ₹4,999 annual proposal was about 16.5% below twelve monthly payments. [CBIC IT services FAQ](https://cbic-gst.gov.in/hindi/sectoral-faq.html) · [Razorpay gateway pricing](https://razorpay.com/pricing/)

As a reference for the pilot, Adobe India listed Acrobat Standard at ₹477.90/month and Pro at ₹638.38/month, including GST, on annual commitments billed monthly when checked for this discussion. Validate MatterDraft's price against the time it saves in the court-bundle workflow. [Adobe India pricing](https://www.adobe.com/in/acrobat/pricing.html)

The first plan should allow **unlimited matters, imported documents, pages, OCR runs and exports**, subject only to measured technical capacity and acceptable-use safeguards. Do not advertise a numerical matter or page capacity until it has passed supported-device testing. Core document preparation, review and bundle export belong in the base plan.

## 2. User and problem

The initial buyer is an Indian advocate or small chamber preparing case document bundles on a desktop computer. Usage may be intermittent. A predictable price and no document or export counting reduce hesitation to import complete matter files and review an output more than once.

## 3. Proposed licence experience

1. A paid seat registers up to two installations for its assigned user. Require browser sign-in and fresh verification when registering a device. A one-time code sent to the user's verified email is the proposed confirmation for v1. Show the registered devices in the portal and send a security notice when one is added. A copied entitlement must fail on installations without the matching private key.
2. Let a user deactivate a computer and register its replacement after reauthentication, including when the old computer is unavailable. Provide recovery for reinstall and hardware changes. Rate-limit repeated replacements and use additional verification or support review for suspicious swaps. Final thresholds are open.
3. After hard expiry, preserve reading, backups and retrieval of completed exports. Gate new matters, imports, edits, OCR, builds and newly generated exports. Let work already in progress finish safely. Resume new work on successful renewal or verification.
4. Show price, renewal cadence, device count and any tax before payment. Explain what happens on cancellation or expiry before asking the customer to subscribe.
5. Licence checks must not upload matter names, source files, OCR text or exported PDFs. Document the minimum activation data and retention policy.
6. Keep licensing separate from the deterministic PDF page-map engine and local document processing.

### Offline verification proposal

At activation, the licensing service issues a signed entitlement for the installation. Pilot **up to 14 days from the last successful online verification**, capped at the paid-through date. Refresh automatically when connected, show the next required check date and warn before it expires. The earlier 30-day window plus seven days of connectivity grace is historical. Define payment-failure and outage behaviour before release.

Two registered installations limit how widely a seat can be shared, but the app cannot reliably verify that the same person operates both computers. Accept the residual risk that a buyer deliberately gives someone the second slot. A removed device may still work offline until its last signed entitlement expires. Avoid invasive device fingerprinting and continuous usage monitoring.

**Activity measurement is separate from entitlement checks.** Product analytics and aggregate usage upload are outside this application's scope. The service uses subscription payment and licence activation state for commercial decisions, without collecting matter activity or document content.

## 4. Payment, renewal and seat changes

The acquisition offer remains a **seven-day free trial**. A 14-day trial and a recurring free matter were discussed and remain outside the proposed offer. See section 7 for the trial rules.

### Payment proposal

- Start with one-off hosted UPI or card payments for one month or one year of access. Evaluate Razorpay first. Show the exact expiry, remind customers before renewal, and extend the existing term when a customer renews early. After a lapse, start a new term on confirmed payment. Manual renewal never initiates a debit. The trial requires no payment method and ends without a debit.
- Add optional monthly AutoPay after verifying renewals, payment failures and seat changes. Show the next debit amount and date. Obtain fresh authorisation where the provider requires it. Razorpay documents that UPI AutoPay and eMandate subscription details cannot be updated in place. A one-time seat charge must never silently change the next debit. [Razorpay subscription update rules](https://razorpay.com/docs/payments/subscriptions/faqs/)
- Defer three- and six-month terms until demand is clear. If demand warrants a middle term, test three months at ₹1,497 per seat before adding another discount. Lifetime access, the earlier ₹1,499 flat chamber plan and ₹199 per matter remain unselected.

### Published offers and advocate referrals

**Give ₹100, get ₹100.** A new personal buyer can use a paid advocate’s referral link or enter their code before the first monthly or annual purchase, including during the trial. At the pilot prices the first month costs **₹399**, or the first year **₹4,899**. The next manual renewal is at the applicable regular price, shown before checkout. A chamber invitation, additional firm licence, self-referral or repeat purchase cannot qualify.

The referring advocate earns **₹100 toward a personal renewal** once the first payment is confirmed and the published refund window has passed. Show the expected release date while pending. Reverse the pending reward on a qualifying payment refund. An available credit remains usable at least through the advocate’s next renewal, including an annual renewal. The advocate chooses when to renew. The credit has no cash payout.

A super admin may publish a fixed-rupee offer with eligible plans, term, audience, first-purchase or renewal eligibility, start and end times and a redemption cap. At checkout apply the largest eligible buyer discount once. A larger public offer preserves the eligible referrer’s ₹100 reward. Show the applied discount and renewal price before payment, and itemise the saving on the invoice. Pausing ends new reservations and honours accepted checkouts and earned credits.

**Pilot budget.** Retain the proposed ₹10,000 ceiling. Each standard referral commits ₹200, which funds up to **50** at that rate. If a public offer gives the referred buyer ₹150 off, the referral uses ₹250 of the ceiling, including the ₹100 referrer credit. Reserve the full amount before accepting checkout. Stop issuing new referral quotes when the remaining budget cannot cover both benefits. Judge the pilot by regular-price renewals and promotion cost per retained buyer.

### Organisation seat changes

1. Assign an already-paid spare seat to a new verified member without another charge. When a member leaves, the firm can revoke and reassign the paid seat within the term. The offline expiry limit applies to devices from the prior assignment.
2. When no spare seat exists, show the prorated cost through the current renewal date and the full price at renewal. For example, a fourth ₹499 monthly seat added halfway through the term costs ₹249.50 now and brings renewal to ₹1,996/month. Activate it after the server verifies payment. Apply the same co-termination rule to annual contracts at the contracted seat rate.
3. Schedule reductions in paid quantity for the next renewal. Changing an assignment during the term does not change the invoice quantity.
4. When an independent advocate adds another advocate, carry the first licence, registered computers and exact paid-through date into the firm plan. Charge only the additional licence for the remaining term. Keep earlier personal invoices accessible to their original buyer. Preview the payer, dates, licences and next total before confirmation.
5. Count assigned licences and registered computers. The licence holder may replace a computer and the firm may replace a departing advocate. Repeated changes require verification or audited support review.

The earlier suggestion of 500 documents or 10,000 pages per matter was a performance-test target, not a verified capacity or customer entitlement. The adopted commercial plan has no document-count quota.

## 5. Release and validation gates

- Complete the outstanding clean-device, Windows x64, Mac Intel, native export/save and installer checks recorded in the desktop acceptance log before treating this as a production filing product.
- Review licences for the components actually included in the Rust desktop package before paid distribution.
- Test activation, transfer, offline grace, renewal, cancellation, reinstall and lost-device recovery using synthetic matters on supported devices.
- Pilot with advocates who prepare bundles at different frequencies and with chambers of different sizes. Measure trial-to-paid conversion, month-two renewals, support time per account, device replacements and reasons for declining. Ask how much time the workflow saves and who performs filing work. Use interviews and account, billing and support records. Keep desktop document activity out of reporting.
- Update the marketing project's pricing FAQ only when commercial terms and release readiness are approved. The earlier deferred-pricing instruction in `MatterDraft_Project_Context_and_Handoff.md` describes its prior landing-page revision; this PRD records the later decision but does not publish a price.

## 6. Acceptance criteria for a future implementation ticket

- A customer can buy a named seat, register two installations and see the seat, devices and renewal terms. A third installation requires an existing registration to be removed. Normal device replacement is self-service.
- A firm can assign or reassign a spare seat, buy a prorated extra seat after seeing today's and the next renewal's prices, and schedule a quantity reduction for renewal. Concurrent requests and duplicate payment events cannot grant more seats than were paid for.
- A temporary connectivity failure does not block work within the defined offline grace period.
- Existing local matters remain readable after expiry or cancellation, with export restrictions clearly disclosed and tested.
- Licence activation and verification requests contain no matter content; synthetic-device and recovery tests pass on each supported platform.
- Pricing copy matches the actual checkout amount, taxes, renewal terms and entitlements.

## 7. Seven-day trial and licensing security requirements

### Decision and proposed operating policy

The owner selected a seven-day trial and requested strong protection across licence operations. The security target is **tamper resistance**, not tamper-proof offline enforcement. An attacker controlling the computer can modify the executable, restore local snapshots or suppress telemetry. Offline revocation and perfect identification of repeat users are not achievable guarantees.

Implementation defaults proposed for the selected trial:

- Start at the first successful desktop activation, with a server-recorded UTC end exactly 168 hours later. A retried activation issues a signed grant with the original expiry. Reinstall, transfer and refresh never restart the trial. The desktop requests activation when the verified owner opens the workspace after signing in.
- Require a verified account and online activation; allow one trial period per account across devices. Rate-limit grant and recovery operations. Multiple accounts remain an abuse limitation; do not introduce invasive hardware fingerprinting to claim otherwise.
- Offer core preparation and export features without a payment method or artificial page quota. These are proposed trial defaults, not published customer terms.
- Allow offline work within the signed trial validity. Trial expiry receives no automatic paid-plan connectivity grace. Display the exact local expiry time and warnings in advance.
- Preserve reading, backups and retrieval of previously generated files after expiry. Gate new matter creation, import, edits, OCR, builds and newly generated exports until activation or renewal.
- Separate login-session expiry, entitlement expiry, subscription cancellation and connectivity failure. An expired login session alone must not invalidate a still-valid offline entitlement.

The proposed paid 14-day limit remains open for review. Before release, define paid-through, refresh-by and hard-expiry semantics independently, including payment failure and outage handling. Connectivity grace must not silently extend a trial or imply a paid renewal.

### Required security controls

1. **Asymmetric signatures:** use a maintained cryptographic library and a versioned signed entitlement format. Keep private signing keys server-side in restricted key management; ship only trusted public verification keys. Specify an algorithm allowlist, issuer, audience, token type, device-key binding, entitlement ID, issue time, validity boundaries and key ID. Reject malformed, unsigned, wrong-audience, wrong-device and unsupported-algorithm tokens. Never load a verification key from a token-supplied arbitrary URL.
2. **Key lifecycle:** document signing-key rotation, overlapping verification keys, compromise response and emergency recovery. Offline clients cannot learn about compromised or revoked keys immediately; bound and disclose that exposure through validity deadlines.
3. **Device proof:** generate an installation key pair and protect its private key with OS credential storage, preferably non-exportable where supported. Verify fresh server challenges when registering or refreshing a device; enforce nonce expiry and single use. Test supported-platform behavior rather than assuming hardware-backed storage exists everywhere. Do not distribute device private keys in matter backups.
4. **Authentication:** use the external browser with Authorization Code + PKCE, validated redirect destinations and state. Do not embed an OAuth client secret in the desktop app. Use short-lived access tokens and rotated or sender-constrained refresh tokens, with replay detection and recovery behavior. Keep credentials out of URLs, logs and browser-accessible persistent storage where avoidable.
5. **Server authority:** authorize every operation against account ownership and roles. Allocate seats, start trials and transfer devices with atomic database changes, uniqueness constraints and idempotency keys. Concurrent requests must not allocate excess seats or create extra trials. Entitlement issuance must reflect committed current state and reject stale device generations.
6. **Local enforcement:** check entitlements at protected operation entry points in the native/local service, not only Vue controls. Keep the PDF page-map engine independent. Check before starting work and specify safe completion of in-flight operations; expiry must not corrupt files or discard completed work. Verify signatures using trusted code, not a mutable SQLite `licensed` flag.
7. **Time and rollback:** use server timestamps, a protected last-seen-time record and monotonic elapsed time where applicable. Suspicious rollback requests online recovery; it never deletes matters. Test sleep, reboot, timezone changes and incorrect clocks. Local snapshots and executable patches remain limitations.
8. **Billing:** verify webhook authenticity over the provider-required original payload, process duplicates idempotently and tolerate out-of-order delivery. Do not grant paid access from a browser checkout-success redirect. Reconcile authoritative provider state, persist retry work and audit renewals, refunds, cancellations and chargebacks. Specify access policy for each state before release.
9. **Transfer and recovery:** require authenticated ownership and reauthentication for sensitive changes. Atomically deactivate the prior assignment, advance its generation and issue the new assignment. Disclose that an offline old device can retain access until its existing entitlement expires. Provide lost-device/reinstall recovery, abuse limits and audited support overrides without restarting a trial.
10. **Operations:** enforce TLS, request validation, rate limits, least-privilege service credentials and server-enforced staff role checks. Protect cookie-based portal mutations against CSRF. Keep production secrets out of preview deployments and client bundles. Maintain audit records without raw tokens, private keys or document data; test database restoration and signing-key recovery separately.

Application/update signing and entitlement signing are separate controls. Neither justifies claims of an uncrackable application. Obfuscation may be an additional deterrent, never the root of trust.

### Required verification before claiming completion

- Seven-day boundary, activation retries, simultaneous trial requests, reinstall, transfer and upgrade preserve the correct original expiry.
- Forged signatures, edited claims, algorithm substitution, wrong issuer/audience/device, replayed challenges and unknown signing keys are rejected.
- Concurrent activations/transfers and stale refreshes cannot resurrect a revoked assignment or exceed allocated seats.
- Refresh-token replay, lost-device recovery and account ownership violations are handled without exposing another customer's licence.
- Duplicate, delayed, reordered and forged payment events cannot grant incorrect access; interrupted processing recovers through reconciliation.
- Offline startup, service outages, clock rollback, sleep/reboot, key rotation and paid/trial expiry follow the disclosed policy.
- Expiry during work preserves originals and completed artifacts; reading, backup and permitted retrieval continue.
- Synthetic native tests on each supported OS exercise protected operations through the local API as well as the UI. Security review and dependency checks precede paid launch.

No licensing code, deployment or security verification is claimed by this PRD update.

### Standards references

- [RFC 8252 — OAuth 2.0 for Native Apps](https://www.rfc-editor.org/info/rfc8252/): external-browser native authentication and PKCE.
- [RFC 9700 — OAuth 2.0 Security Best Current Practice](https://www.rfc-editor.org/rfc/rfc9700.html): token replay protection and refresh-token handling.
- [RFC 8725 — JSON Web Token Best Current Practices](https://www.rfc-editor.org/rfc/rfc8725.html): applicable if JWT/JWS is selected; explicit algorithms, issuer/audience validation and token-type separation.
