# Delivery validation

Validated on 29 October 2026 UTC (30 October in India). This report describes the delivered source and generated static export, not a deployed production domain.

## Build and automated checks

The project was installed and built with Node.js **24.22.1** and npm **11.9.0**. The recommended Node release in `.nvmrc` is **26.13.0**. Exact dependency versions and the compatibility decision are recorded in `DEPENDENCY-AUDIT.md` and `package-lock.json`.

| Check | Result |
| --- | --- |
| Dependency installation | Completed successfully with the pinned dependency tree and lockfile. |
| `npm run typecheck` | Passed. |
| `npm test` | Both test files passed: 11 configuration/content cases and 7 encoding/cache cases. |
| `npm run generate` | Completed successfully; generated the homepage, all three policy routes, fallback pages, payloads and static assets. |
| `npm run verify` | Passed; its size report is printed to the terminal. |
| Component compilation | All 20 landing Vue components passed client and SSR compilation checks. |
| Controller lifecycle | Listener/timer cleanup and repeat disposal were checked; an in-flight mock request was cancelled on cleanup. |

The exported-page verifier checks canonicals, descriptions, social images, one H1 per content route, unique element IDs, draft-policy noindex settings, structured data, required discovery/assets and size budgets. It also checks that the HTML CSP precedes scripts and includes the expected hashes. Policy publication tests confirm that unresolved business fields prevent publication mode from generating a misleading published result.

The preview-server tests cover `Accept-Encoding` quality values, forbidden encodings, identity fallback, unavailable sidecars, rejection when no acceptable representation exists, no-cache handling for missing assets and the mutable Nuxt build manifest.

## Production browser checks

The generated static site was opened in Chromium. Responsive checks used actual CSS viewport widths of **1440, 1280, 768, 640, 390 and 320 pixels** in an internal same-origin test frame. The frame was scaled only for inspection; the page's layout viewport retained the selected width. These checks are browser simulations, not a physical-device test matrix.

At each width, the document's scroll width stayed within its available client width. Mobile and tablet heading, paragraph, link and button width checks found no text overflow. The hero and workflow layouts were also inspected visually.

| Flow | Observed result |
| --- | --- |
| Hero and product illustration | Rendered at desktop, tablet and mobile widths; the illustrative sequence initialized. |
| Mobile navigation | Menu opened, followed its Automation link and closed. |
| Demo dialog | Opened and closed, supported Escape, and fitted the mobile viewport without horizontal overflow. |
| Default request mode | Fictional test details produced the selectable copy fallback; no booking request was sent. |
| Enlarged workspace | Opened the current product view in its dialog and closed successfully. |
| OCR example | Finished its illustrative recognition step and made the sample text editable. |
| Collation and pagination | Adding two affidavit pages changed 196 to 198; Agreement moved to pages 45–83 and its index reference became 45. |
| Manual bookmark | A keyboard-activated Add action created a sample bookmark at page 196. |
| Template generation | Selecting Affidavit exposed Deponent; submission populated Supporting Affidavit and the entered fictional deponent in the preview. |
| Volume splitting | Default allocation showed 296/295/273 pages; a 450-page target produced 421/443. A 150-page target retained oversized documents and displayed their review warnings. |
| Validation | Resolving all three example findings changed the count from 3 to 0. |
| Policy navigation | Privacy loaded through the Nuxt link with `noindex, follow`; returning to the landing page restored functioning controls. One pagination toggle after return produced 198 pages. |
| Scroll reveals | All 12 workflow steps acquired their visible state when the section was reached. |
| Missing page | An unknown route rendered the branded 404 page and return action. |

No hydration errors or refused-content CSP errors were observed during these checks. The browser environment emitted its own extension-metadata messages; those did not originate from the application.

### JavaScript-disabled rendering

A copy of the exported homepage was checked with scripts removed and iframe script execution disabled. It retained all **28 headings**, visible hero/product content and the explanatory noscript notice. No scroll-reveal hiding classes or hero initialization flag were present. Interactive examples and the request form correctly remain JavaScript features.

The responsive/no-JS test harness is excluded from the delivery. Production frame restrictions remain in the delivered headers. Reduced-motion CSS and controller branches were reviewed; the browser's operating-system preference was not changed or physically device-tested.

## Size checks

The numbers below were recorded by the verifier for this historical validation. Gzip values are computed from the generated files for comparison and budgeting; they are not a network-timing benchmark. The export also includes gzip and Brotli sidecars.

| Resource | Measured size |
| --- | ---: |
| Homepage HTML | 115,612 bytes uncompressed; 22,279 bytes gzip |
| All route JavaScript chunks combined | 407,393 bytes uncompressed; 129,609 bytes gzip |
| All generated CSS combined | 167,330 bytes uncompressed; 33,422 bytes gzip |
| Self-hosted variable WOFF2 font | 71,200 bytes |

The all-route JavaScript total includes policy chunks; it is not the initial homepage transfer size. The font was reduced from 352,240 to 71,200 bytes, approximately **80% smaller**, while retaining the variable font axes and the characters required by this design. The page does not need external font or animation services.

No Lighthouse score, Core Web Vitals field result or guaranteed loading time is claimed. Hosting, network conditions, cache state and visitor devices will affect real performance.

## Before a public launch

- Set a verified demo email or endpoint if requests should leave the visitor's browser. No real submission service was configured or contacted during validation.
- Complete and review the policy Markdown before enabling publication mode. The supplied pages visibly remain drafts and are excluded from discovery exports.
- Regenerate after changing the domain, public configuration, source content or assets, then deploy the matching HTML, compressed assets and headers together.
- Verify the selected host's response headers and clean URLs after deployment. This delivery was not published to a hosting provider.

The dependency audit records one remaining upstream low-severity deepmerge advisory affecting seven package entries, with no current patched upstream release. It is documented with the inspected build-tool usage and is not represented as a clean audit.
