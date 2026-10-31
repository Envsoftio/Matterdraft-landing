# Early access → Google Sheets

MatterDraft uses the same path as ProctorPlus: the on-page form posts to a Netlify Function, which validates the request and sends it to a Google Apps Script web app. Keep the Sheet and webhook credentials private.

## Create the Sheet

1. Create a Google Sheet with a tab named **Early Access**.
2. Put these headers in row 1, in this order: `id`, `submittedAt`, `name`, `email`, `role`, `platform`, `consentAt`, `source`.
3. Copy the spreadsheet ID from the URL, between `/d/` and `/edit`.

## Deploy the Apps Script receiver

1. In the Sheet, choose **Extensions → Apps Script** and replace the editor contents with [early-access-google-sheets.gs](early-access-google-sheets.gs).
2. Under **Project Settings → Script properties**, set `SPREADSHEET_ID` to the ID above and `WEBHOOK_SECRET` to a random string of at least 32 characters. Keep the secret out of the repository.
3. Choose **Deploy → New deployment → Web app**. Set **Execute as: Me** and **Who has access: Anyone**. Authorize it and copy the `/exec` URL. If your Google organization disallows public web apps, this deployment method will need an approved alternative.
4. When updating the script later, choose **Deploy → Manage deployments → Edit → New version → Deploy** so the existing `/exec` URL stays valid.

## Configure Netlify

1. Set `EARLY_ACCESS_GOOGLE_SHEETS_URL` to the `/exec` URL and `EARLY_ACCESS_GOOGLE_SHEETS_SECRET` to the same secret in Netlify environment variables. Give both **Builds** and **Functions** access. Do not prefix either with `NUXT_PUBLIC_`.
2. Build and deploy from the repository using `npm run generate` and `dist` as the publish directory. Netlify will deploy `netlify/functions/early-access.mjs` as a function too. A manual upload of only `dist/` does not include it.
3. Complete and publish the MatterDraft privacy policy with the actual Google provider, processing and retention details.
4. Submit a test entry on the deployed site. Confirm the success message appears and a matching row is added to **Early Access**. If submission fails, check Netlify Function logs and **Apps Script → Executions**. Remove the test row if appropriate.

The Function accepts only valid names, work emails, listed roles and platforms, and contact consent. The script checks the shared secret and writes the row under a lock. If Apps Script does not confirm the write, the visitor gets an error instead of a success message. Keep the Sheet access limited to the people who manage signups; rotate the secret and redeploy if it leaks.
