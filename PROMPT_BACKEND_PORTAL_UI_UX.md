# Copy-ready prompt — MatterDraft account and support application

Use this prompt with `PRD_CUSTOMER_AND_ADMIN_BACKEND.md` and the current repository. This is a design task; it does not authorise deployment or settle billing and licence policy.

---

Act as a senior product designer and UX architect. Design the customer and staff web experiences for **user login, subscription management, device licensing and support tickets only**. Treat the PRD as the scope boundary. Existing account membership and staff access are supporting controls, not additional product lines.

Documents, OCR, PDF generation and matter files stay on the desktop. The web app must not offer cloud document browsing, matter uploads, product usage dashboards, analytics, notification inboxes, campaigns, incident management, release management or general CRM screens.

Design verified registration, sign-in, recovery, account switching and native desktop sign-in handoff. Support personal and organisational accounts with existing invitation, membership and ownership-transfer flows. Show server-enforced role restrictions, including private tickets within an organisation. Staff have individual verified accounts and active roles; do not design impersonation.

For subscriptions, design current state, plan/quantity selection, hosted checkout, pending/failed/confirmed payment, invoices and cancellation or change review. Show actual provider-calculated amounts and taxes when available; label unknown commercial terms as decisions pending. The seven-day trial is selected and ₹499/device/month is a proposed launch price, not an existing charge.

For devices, show licence state, assigned device and policy-dependent actions only when the licensing contract supports them. Show temporary connectivity failure without inventing grace periods, expiry restrictions or transfer rules. Initial activation requires internet. Do not design permanently offline activation in v1.

For support, design customer ticket list/create/detail/reply and staff queue/search/detail/reply/status change. Ticket states are Open, Awaiting support, Awaiting customer, Resolved and Closed. Customer tickets are private to their creator, including within organisations. No attachments, private staff notes, SLA promises, reopening promises, issue tracker or incident page in the first slice. Include clear feedback when a reply's outcome is uncertain.

Customer navigation: Account, Subscription, Devices, Support, and necessary profile/security controls; authorised organisation users may see Members and relevant account activity. Staff navigation: customer/account inspection, subscriptions, devices, support tickets and audit access needed to operate them. Omit unavailable destinations and roadmap cards.

For every core screen, show loading, empty, success, error and forbidden states where relevant. Use readable error messages and safe request references; never display raw stack traces, SQL, provider HTML or ticket text in logs. Include keyboard/focus behavior, 1440 px desktop, 1024 px tablet and 390 px mobile layouts. Keep visual design restrained and use realistic synthetic data with no real legal matter content.

Deliver a scope and decision list, navigation maps, role matrix, numbered flows, screen inventory, linked wireframes, interaction/state tables, exact key copy and a developer handoff checklist. Separate illustrative data from implemented functionality. Keep the outstanding membership and native desktop checks visible.
