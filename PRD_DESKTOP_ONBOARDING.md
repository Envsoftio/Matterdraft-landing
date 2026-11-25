# MatterDraft Studio — Desktop onboarding and Apple Silicon pilot

**Status** · Local portal and desktop scaffolding exist. Packaged sign-in against the local backend is the first integration checkpoint.

**Updated** · 25 November 2026

[Implementation task list](TASKS_DESKTOP_ONBOARDING.md) · [Customer and admin PRD](PRD_CUSTOMER_AND_ADMIN_BACKEND.md) · [Trial and licensing policy](PRD_DEVICE_LICENSING_AND_PRICING.md#7-seven-day-trial-and-licensing-security-requirements) · [Desktop licence requirements](../matterdraft_app/docs/PRD_DEVICE_LICENSING_AND_PRICING.md)

### Local development

Develop and verify the integration against `http://localhost:3000` with the desktop callback `legal.matterdraft.studio:/oauth/callback`. Use mail previews for local account verification and confirm migrations and active OAuth client registration against the intended test database. Use an ad hoc–signed Apple Silicon build for packaged testing.

## Goal and pilot scope

An invited tester can create a verified account from the landing page, download and install MatterDraft on an Apple Silicon Mac, connect the desktop app to that account, and export a first bundle using synthetic matter files. The installation instructions are part of the download page and also have a standalone URL.

The pilot uses a build without Apple Developer ID signing or notarization. The existing development evidence is for an ad hoc–signed Apple Silicon app on one Mac. The pilot package and supported macOS versions must be verified through the actual browser download on clean machines. Windows, Intel Macs, paid checkout, public distribution, and automatic updates are outside this pilot. Require Developer ID signing and notarization for broader Mac distribution. [Desktop acceptance log](../matterdraft_app/docs/ACCEPTANCE_TESTS.md#current-matterdraft-application-completion--22-november-2026)

The registered-customer workspace has a download page for distribution-approved releases. It requires a verified customer account, issues a short-lived link to a private object, and records link issuance by customer, platform, version, and time. This release list is for builds approved for all verified customers. The invite-only pilot has a separate eligibility requirement for its builds and activation.

## Customer journey

1. **Create account.** The landing page leads to account creation. Existing users can sign in. After email verification and sign-in, eligible users return to **Download MatterDraft**. Provide resend and recovery for delayed or expired verification links. Use an approved return destination within the portal.
2. **Download.** Show the Apple Silicon installer, version, verified macOS requirements, and pilot notice. Require a verified account and server-checked pilot eligibility before granting access to the installer. Explain how to get help if access is unavailable or the Mac is unsupported.
3. **Install.** Present the full numbered guide on the download page before download and keep it visible afterward. Use the verified package steps from download through opening the app. Include screenshots where a tester needs to recognise a window or control. The standalone **Installation guide** uses the same content and can be shared without granting installer access. Describe the pilot build accurately and provide a support path if macOS blocks it. Check the instructions against the actual package and operating system prompts. Keep normal system protections enabled.
4. **Connect the app.** On first launch, guide the tester to browser sign-in. Allow the current portal browser session to be reused, show the identity being connected, and give the tester a way to switch accounts. Return to MatterDraft after approval. Show a retry path for cancelled or expired requests, callback failure, and connectivity problems.
5. **Activate.** Require online activation. Start the card-free seven-day trial on the first successful desktop activation and display the exact expiry in local time. One server record per account controls the 168-hour trial and one active trial installation. Preserve any earlier portal-started trial and its original expiry. Activation retries and reinstall or recovery reuse that record. Move new trial starts out of the portal billing flow and prevent its old endpoint from issuing new trials there.
6. **Set up or unlock the vault.** Explain that account sign-in connects the app and the separate vault password protects files on this Mac. A new user sets up the vault and saves the recovery key. A returning user can unlock the existing vault. The pilot handoff includes synthetic sample files and ends when the tester exports a bundle to a chosen location.

## Account, licence, and data protection

- Reuse the Nuxt portal and Better Auth. Use the registered desktop callback and system browser OAuth Authorization Code with PKCE S256. Validate the callback and state, handle it in the native client, and keep tokens in the operating system credential store. Ship a public client ID and keep server secrets on the server. [Desktop authorization contract](docs/portal-setup.md#desktop-authorization-contract)
- Check identity, account access, pilot eligibility, and trial rules on the server for activation. Enforce access again when issuing installer links. Use a private artifact or an authenticated download endpoint. If handing off to object storage, use a short-lived link. The installer can be copied, so activation must enforce access independently of the download.
- Issue a signed, installation-bound trial grant and verify it in Rust at protected entry points. Allow local work offline while the grant is valid. After expiry, allow in-progress work to finish safely, and preserve reading, backup and retrieval of completed exports within vault permissions. Gate new preparation work and newly generated exports. App package signing and licence grant signing serve separate purposes. [Desktop licence requirements](../matterdraft_app/docs/PRD_DEVICE_LICENSING_AND_PRICING.md#native-architecture-and-verification)
- Keep matter names, PDF content, OCR text, exports and vault credentials on the computer. Keep OAuth credentials and vault data out of logs and support reports. Use synthetic files for pilot testing. [Local security and retention](../matterdraft_app/docs/LOCAL_SECURITY_AND_RETENTION.md)

## Pilot acceptance

- On a clean Apple Silicon Mac, an invited tester follows the actual landing page, verification email, gated download and visible instructions without assistance, signs in from the packaged app, activates the trial, sets up the vault, and exports a synthetic bundle.
- The standalone guide and download page show the same steps for the same release. Signed-out or ineligible users cannot obtain an installer through the portal, and a copied installer cannot activate for an ineligible account.
- Verification resend, login cancellation, account switching, callback failure and connectivity loss each give the tester a clear recovery action. A platform block is recorded with the exact prompt and supported recovery path. A build that fails clean-device installation blocks opening the pilot.
- Repeated or concurrent activation, an existing portal trial, reinstall, offline use and trial expiry follow the rules above. Confirm that expiry leaves the original files and completed exports accessible within the vault.
- Record the installer version, tested macOS versions, results, known limits and named support contact before giving invited testers access.
