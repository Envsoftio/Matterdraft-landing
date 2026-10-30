# MatterDraft Studio — Nuxt landing page

A complete Nuxt and Tailwind implementation of the approved MatterDraft landing page, with responsive product illustrations, interactive workflow examples and separate policy routes. The delivery includes the editable source and a generated `dist/` directory for static hosting.

MatterDraft is in development for Windows and macOS. The website uses fictional matters and documents. Its interactions illustrate intended workflows; this project does not contain the desktop application, an OCR/PDF processing engine, a booking service, checkout or a document-upload backend.

## Start locally

Use **Node.js 26.13.0 LTS**, the version recorded in `.nvmrc`. The implementation and build checks for this delivery have also been run with **Node.js 24.22.1**. The package engine range is `^22.22.3 || ^24.15.0 || >=26.0.0`. Node is needed to develop or rebuild the site; static hosting does not need a Node server.

From this directory:

```sh
npm ci
npm run dev
```

Open the local URL printed by Nuxt, normally `http://localhost:3000`. The development server binds to `0.0.0.0`. The `predev` script refreshes generated content before Nuxt starts.

To inspect the included production build:

```sh
npm run preview
```

This serves `dist/` at `http://localhost:3000` with the generated security headers, clean route handling and compression negotiation. It uses Node built-ins, so previewing an already-generated `dist/` does not require installing the Nuxt dependencies. Use the HTTP preview instead of opening `dist/index.html` as a local file. The preview script accepts `PORT` and `HOST` environment variables, or arguments such as `npm run preview -- --port 4173 --host 127.0.0.1`; its defaults are `3000` and `0.0.0.0`.

### Commands

| Command | Purpose |
| --- | --- |
| `npm ci` | Install the exact versions in `package-lock.json` and run Nuxt's preparation step. |
| `npm run dev` | Regenerate content and start development with hot reload. |
| `npm run content` | Rebuild policy data, robots, sitemap and Markdown/agent content. |
| `npm run typecheck` | Run Nuxt/Vue type checking. Normal development and build commands do not run this check automatically. |
| `npm test` | Run focused configuration, discovery, legal-publication, compression-negotiation and cache tests. |
| `npm run generate` | Regenerate content, prerender the site and recreate the complete static `dist/` export. |
| `npm run verify` | Check the current `dist/` and write `BUILD-REPORT.json`. Run after generation. |
| `npm run preview` | Serve the generated static export. It accepts GET/HEAD requests, not form submissions. |
| `npm run build` | Create the optional Nuxt server build in `.output/`. This does not run the static export step. |
| `npm run preview:ssr` | Run `.output/server/index.mjs` after a server build. This is separate from the delivered static deployment. |

## Source layout

| Location | What to edit or inspect |
| --- | --- |
| `app/pages/` | Homepage and the `/privacy`, `/terms` and `/refund-policy` routes. |
| `app/components/landing/` | Header, premium hero, feature sections, footer and dialogs. Its own README explains the stable interaction hooks. |
| `app/utils/landing/` | Scoped browser interactions for the hero, navigation, workflow examples, dialogs and form. |
| `app/composables/` | Landing lifecycle and shared page SEO. |
| `app/assets/css/` | Tailwind setup, shared tokens, typography and the approved responsive illustration styles. |
| `content/site.json` | Product facts and descriptions used in the generated Markdown and discovery content. Keep these aligned with the visible landing-page copy. |
| `content/legal/` | Editable source policy drafts. These are the source of truth for the policy pages. |
| `app/data/legal/` | Generated policy modules. Recreate these with `npm run content`. |
| `public/` | Fonts, brand and social assets, icons, manifest and generated discovery files. |
| `scripts/` | Shared settings, content generation, static export, preview server and build verification. |
| `tests/seo.test.mjs` | URL validation, indexing controls, XML escaping and generated-content tests. |
| `tests/static-response.test.mjs` | Compression quality values, fallback/rejection behavior and static cache rules. |
| `dist/` | Ready-to-host static output. Generation replaces this directory. |
| `deploy/headers.json` and `vercel.json` | Generated deployment settings matching the exported HTML. |

The product interfaces remain HTML/SVG illustrations with real controls. They are not flattened screenshots. Preserve the documented IDs and `data-*` hooks when editing their markup.

## Configuration

Copy `.env.example` to `.env` to override the defaults, or provide the same variables in your build environment. For example, use `cp .env.example .env` in a POSIX shell or `Copy-Item .env.example .env` in PowerShell.

| Variable | Default | Effect |
| --- | --- | --- |
| `NUXT_PUBLIC_SITE_URL` | `https://matterdraft.legal` | The one origin used for canonical URLs, social URLs, sitemap entries and Markdown links. |
| `NUXT_PUBLIC_INDEXABLE` | `true` | Enables homepage indexing. Set to `false` for a non-indexable preview build. |

`scripts/site-config.mjs` validates the site URL as an absolute HTTPS origin. A trailing root slash is accepted and normalized; credentials, a path, query or fragment are rejected. This project is configured for the root of an origin, not a subdirectory deployment.

The content generator and Nuxt configuration use the same settings loader. It reads `.env` through Node's `process.loadEnvFile` when the file exists. The `INDEXABLE` alias is also supported; if it and `NUXT_PUBLIC_INDEXABLE` are both set, their values must agree.

**All `NUXT_PUBLIC_*` values are public.** Never put passwords or secret API keys in them.

For a static site, settings are resolved at build time. After changing the domain, indexing setting, content or assets:

```sh
npm run generate
npm run verify
```

Deploy the regenerated `dist/` and its matching header configuration together. Changing environment variables on a file-only host cannot update an existing static export. Restart the development server after editing environment settings.

### Preview indexing

With `NUXT_PUBLIC_INDEXABLE=false`, page metadata requests `noindex`, `robots.txt` disallows crawling, and the sitemap contains no page entries. The generated `_headers` file and local preview also add a noindex response header; Vercel uses the page's robots metadata for build-specific indexing settings. Search directives are not access controls; use the hosting provider's access protection when a preview must be private.

## Policy drafts and publication

The three policy routes are rendered from:

- `content/legal/privacy.md`
- `content/legal/terms.md`
- `content/legal/refund-policy.md`

They are **review drafts**, with unresolved business details. By default they have a visible draft banner and `noindex` metadata, are omitted from the sitemap and agent exports, and have no exported `public/legal/*.md` copies. They remain crawlable so a crawler can read their noindex metadata. They are accessible website routes, not confidential documents.

The generator parses trusted, repository-owned Markdown at build time. It removes the first H1 from the HTML because the policy layout supplies the page heading, removes the Publication notes appendix, preserves the draft introductory text, and rewrites the old policy filenames to the correct site routes. The source Markdown is unchanged by generation. The parser is not an untrusted-content sanitization service.

The publication environment flag has been removed. These pages remain visible review drafts with `noindex` metadata until the source policies are completed and a separate publication change is made. The refund draft preserves mandatory remedies alongside the no-voluntary-refunds business position.

## Rendering, interaction and discovery

Nuxt renders the page content on the server during generation, then Vue hydrates it for interaction. Text and illustrations start visible without JavaScript. The interactive examples require JavaScript, as the page's noscript notice explains.

The client controller owns event listeners, timers, animation frames, observers and dialog cleanup for each landing-page mount. It supports keyboard controls, native dialogs, Escape/backdrop closing and focus restoration. Hero and scroll effects respect reduced-motion preferences. These are implementation features, not a claim of complete accessibility certification.

All workflow examples use sample data. OCR text, template fields, document ordering, pagination, bookmarks, volume planning, validation and PDF tool appearances are demonstrations. They do not open, upload, process, redact or export actual legal files. In particular, a visual redaction example does not remove underlying file content.

SEO uses Nuxt's built-in `useSeoMeta` and `useHead`. Pages have individual metadata and canonical links, a local social image, and truthful structured data that retains the product's development status. The markup does not invent pricing, customer ratings or released availability.

The build generates:

- `robots.txt` and `sitemap.xml` with the configured indexing rules.
- `llms.txt` as a concise guide following the [llms.txt proposal](https://llmstxt.org/).
- `index.md` as a readable product overview.
- `llms-full.txt` containing the product overview; draft policy text is excluded.

Markdown alternates and a `rel="describedby"` response link make these resources discoverable. These files do not guarantee search ranking or inclusion in an AI answer. [Google's guidance](https://developers.google.com/search/docs/appearance/ai-features) says its AI search features use the normal SEO fundamentals and do not require a special AI text file.

## Static deployment and headers

`npm run generate` performs three steps: content generation, Nuxt prerendering, then `scripts/export-static.mjs`. The export copies `.output/public/` into a fresh `dist/` directory, adds a Content Security Policy meta tag before scripts in each HTML document, generates security/cache settings and adds Brotli/gzip sidecar files for eligible assets.

Deploy **the contents of `dist/`** to the origin root. Configure the host to serve `/privacy` from `privacy/index.html` and similarly for the other policy pages, and to use the generated `404.html` with an actual 404 response for missing pages.

For a build-on-host workflow, use `npm ci` as the installation command, `npm run generate` as the build command and `dist` as the output directory. Select static hosting rather than a server-rendered Nuxt deployment when configuring the host.

The export produces three related header artifacts:

| File | Use |
| --- | --- |
| `dist/_headers` | Static header rules for hosts that support this format, including Netlify and Cloudflare Pages. |
| `deploy/headers.json` | Shared header values consumed by the included preview server; useful when configuring another host. |
| `vercel.json` | Vercel static build/output settings and stable HTTP header rules. Build-specific script restrictions travel in the HTML. |

The Content Security Policy allows local scripts and hashes of the actual generated inline scripts. It does not enable script `unsafe-inline` or `unsafe-eval`. Inline styles remain allowed because the illustrations and interactions use style attributes. Fonts and network connections are limited to the same origin.

The build-specific policy is embedded in each exported HTML page, so the script hashes travel with the content they protect on every static host. Netlify/Cloudflare `_headers` and the local preview also deliver the full policy as an HTTP header. Vercel's HTTP policy contains only stable `frame-ancestors`, `object-src` and `base-uri` restrictions, while the HTML meta policy supplies the script, style and connection rules. This keeps remote builds independent of previously generated hashes in project configuration. Framing restrictions require the HTTP headers; they are not supplied by the meta tag.

Additional headers include `X-Content-Type-Options`, frame restrictions, `Referrer-Policy`, a camera/microphone/geolocation `Permissions-Policy`, discovery links and applicable indexing controls. Hashed `/_nuxt/` assets receive a long immutable cache lifetime; the mutable `/_nuxt/builds/latest.json` has an explicit no-cache override. Inspect the generated files for the full rules.

**HTML, CSP hashes and compressed copies must match.** Regenerate and deploy them together after changes. The export overwrites `vercel.json` and `deploy/headers.json`; permanent changes belong in the export script. Retain the supplied Vercel configuration when deploying there, or apply the equivalent HTTP rules on another host. Inspect the deployed response headers as part of release verification.

Hosts do not universally interpret `_headers` or automatically select `.br`/`.gz` files. Configure equivalent headers and content negotiation where necessary, or let the CDN compress the original assets. The included preview server demonstrates negotiation with the correct content type, content encoding and `Vary: Accept-Encoding`.

Primary hosting references: [Netlify custom headers](https://docs.netlify.com/manage/routing/headers/), [Cloudflare Pages headers](https://developers.cloudflare.com/pages/configuration/headers/), and [Vercel project configuration](https://vercel.com/docs/project-configuration).

## Validation and maintenance

After editing:

```sh
npm run content
npm run typecheck
npm test
npm run generate
npm run verify
npm run preview
```

The verifier checks generated page metadata, one H1 per route, duplicate IDs, draft-policy indexing, required assets, structured-data consistency and inline-script hashes against the HTML CSP. It also records asset-size checks in `BUILD-REPORT.json`. See `VALIDATION.md` for the completed browser checks and their scope. These checks are not a Lighthouse score or a real-user loading-time measurement.

Review responsive layouts and interactive flows in a browser after meaningful markup or behavior changes, including keyboard navigation, reduced motion, product-view dialogs and navigation back from a policy route. Test the deployed host's routes and headers as well as the local preview.

Dependencies are pinned with a lockfile: Nuxt `4.6.3`, Vue `3.5.44`, Vue Router `5.4.0`, Tailwind and its Vite plugin `4.3.3`, `vue-tsc` `3.3.14`, TypeScript `6.0.3` and build-time Markdown parser `marked` `18.1.2`.

**TypeScript 6.0.3 is intentional.** Although TypeScript 7.0.2 is the current latest major, the selected `vue-tsc` CLI still resolves `typescript/lib/tsc`, which native TypeScript 7 does not export. See [DEPENDENCY-AUDIT.md](DEPENDENCY-AUDIT.md) for the primary sources, compatibility reasoning and the remaining low-severity upstream `deepmerge` advisory.

## Fonts and licenses

Inter is self-hosted at `public/fonts/inter-latin-variable.woff2`, preloaded locally and configured with `font-display: swap`. No Google Fonts request is needed. The font's **SIL Open Font License 1.1** and copyright notice are included in `public/fonts/OFL.txt` and copied into the static export. Preserve those notices when distributing the font.

The site uses local brand/social assets and inline SVG artwork. Third-party dependencies retain their respective licenses; the font license applies to the font software, not to MatterDraft branding or product copy.
