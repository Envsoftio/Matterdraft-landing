# Dependency compatibility and audit

**Review date: 30 October 2026.** This record describes the pinned source project and the intended static `dist/` deployment. It is a dependency and usage review, not a penetration test or a claim that the project has no security risks.

## Version selection

Direct dependencies are pinned and recorded in `package-lock.json`. Use `npm ci` to reproduce that resolved tree.

| Package/runtime | Selected version | Primary source |
| --- | --- | --- |
| Nuxt | 4.6.3 | [npm metadata](https://registry.npmjs.org/nuxt/4.6.3), [Nuxt release](https://github.com/nuxt/nuxt/releases/tag/v4.6.3) |
| Vue | 3.5.44 | [npm metadata](https://registry.npmjs.org/vue/3.5.44) |
| Vue Router | 5.4.0 | [npm metadata](https://registry.npmjs.org/vue-router/5.4.0) |
| Tailwind CSS | 4.3.3 | [npm metadata](https://registry.npmjs.org/tailwindcss/4.3.3) |
| Tailwind Vite plugin | 4.3.3 | [npm metadata](https://registry.npmjs.org/@tailwindcss%2fvite/4.3.3) |
| TypeScript | 6.0.3 | [npm metadata](https://registry.npmjs.org/typescript/6.0.3); compatibility exception below |
| vue-tsc | 3.3.14 | [npm metadata](https://registry.npmjs.org/vue-tsc/3.3.14) |
| marked | 18.1.2 | [npm metadata](https://registry.npmjs.org/marked/18.1.2) |
| Recommended Node.js | 26.13.0 LTS | [Official Node release, 28 October 2026](https://nodejs.org/en/blog/release/v26.13.0) |

The delivery work also ran on Node.js 24.22.1. Nuxt 4.6.3 declares `^22.22.3 || ^24.15.0 || >=26.0.0` as its engine range. Its [Vite builder](https://registry.npmjs.org/@nuxt%2fvite-builder/4.6.3) requests Vite `^8.3.5`; Tailwind's plugin accepts Vite `^5.2.0 || ^6 || ^7 || ^8`.

### TypeScript 6 compatibility exception

The live npm registry reports TypeScript **7.0.2** as the current latest release. The published `vue-tsc` **3.3.14** tarball was inspected directly: its CLI calls `run()`, whose default compiler lookup remains `require.resolve('typescript/lib/tsc')`. The TypeScript 7 package exports the new native API entry points and does not export that compiler subpath.

The broad `typescript: >=5.0.0` peer declaration does not establish runtime compatibility with native TypeScript 7. The language-tools changelog's TypeScript 7 migration concerns its workspace/build and tests; it also explicitly supports the TypeScript 6 compatibility package. TypeScript **6.0.3** is the newest stable 6.x release found in the registry and carries no deprecation notice.

This project therefore uses TypeScript 6.0.3 for its Nuxt/Vue type checker. A future upgrade should be accompanied by an actual `nuxt typecheck` run against the selected Vue tooling.

Primary references:

- [TypeScript 7.0.2 package metadata](https://registry.npmjs.org/typescript/7.0.2).
- [Published vue-tsc 3.3.14 package](https://registry.npmjs.org/vue-tsc/-/vue-tsc-3.3.14.tgz).
- [Vue language-tools compiler entry point](https://github.com/vuejs/language-tools/blob/master/packages/tsc/index.ts).
- [Vue language-tools changelog](https://github.com/vuejs/language-tools/blob/master/CHANGELOG.md).

## Remaining advisory: deepmerge

The audit for this dependency set reported **seven low-severity affected package entries**, all associated with **one underlying advisory**, and **zero moderate, high or critical findings**. Counts describe that audit snapshot; the registry advisory database may change.

| Item | Finding |
| --- | --- |
| Advisory | GHSA-gcqx-w48m-w2h4 / CVE-2026-93753 |
| Reviewed classification | Low, CVSS v4 2.7 |
| Affected package range | deepmerge >=4.2.0 through 4.3.1 |
| Installed version | 4.3.1 |
| Patched upstream release | None available at the review date |
| Latest npm release | 4.3.1, published 16 March 2023 |

The [GitHub-reviewed advisory](https://github.com/advisories/GHSA-gcqx-w48m-w2h4), last updated on 27 October 2026, describes prototype poisoning of objects returned by a vulnerable merge operation. Exploitation requires attacker-controlled object properties to reach that operation and affect a subsequent property read. This is distinct from a demonstrated takeover of every application that happens to depend on the library.

The [live npm registry](https://registry.npmjs.org/deepmerge) still lists only `4.3.1` as its latest tag, with no newer patched release. The [upstream fix proposal, PR #274](https://github.com/TehShrike/deepmerge/pull/274), was closed without merging. The [upstream issue](https://github.com/TehShrike/deepmerge/issues/273) being closed does not establish a released remediation.

### Installed path and usage

`npm ls deepmerge --all` identified this installed path:

```text
nuxt 4.6.3
  @nuxt/nitro-server 4.6.3
    nitropack 2.13.5
      @rollup/plugin-node-resolve 16.0.3
        deepmerge 4.3.1
```

Both installed resolver builds were inspected:

- `node_modules/@rollup/plugin-node-resolve/dist/es/index.js`
- `node_modules/@rollup/plugin-node-resolve/dist/cjs/index.js`

Each uses `deepMerge` once, to copy the resolver's built-in defaults before freezing them:

```js
const DEFAULTS = deepFreeze(deepMerge({}, defaults));
```

The resolver combines supplied options separately using object spread. The inspected deepmerge call does not receive a website request body, contact-form payload or document contents. No visitor-controlled input path to this call was identified.

The observed dependency is part of the Node build tooling. The delivered `dist/` consists of static HTML, CSS, browser JavaScript and assets; deploying that directory does not run the Nuxt/Nitro server or Rollup resolver. This limits the exposure of the intended static deployment. It does not erase the advisory from the source dependency tree.

“Build tooling” describes this observed usage, not npm's dependency classification: Nuxt is declared in `dependencies`, so omitting development dependencies is not evidence that the finding has disappeared.

### Decision

Keep Nuxt **4.6.3** and the tested lockfile. There is no patched upstream deepmerge version available for a straightforward version override. The automatic audit suggestion to downgrade Nuxt to **4.1.3** would undo the selected current Nuxt security patch; it is not an appropriate remediation for this delivery.

No forced audit fix, downgrade, substitute package or unpublished fork has been applied. The finding remains documented. Reassess when a maintained upstream release or dependency update removes the affected library, and verify any change with the project's type checks, tests and static build.

## Reproduce and update this record

From the project root:

```sh
npm ci
npm ls deepmerge --all
npm audit
npm view deepmerge version dist-tags --json
npm run typecheck
npm test
npm run generate
npm run verify
```

`npm audit` and `npm view` require registry access. The audit can return a non-zero status while reporting the recorded low-severity finding; that status is not a build failure or proof of an exposed website exploit. Review the current report and dependency path before deciding on changes.

This assessment applies to the inspected dependency versions and static delivery architecture. New runtime services, external content pipelines or different dependency versions need their own usage review. Generated asset sizes and final browser/build validation belong in the build report; no performance benchmark is asserted by this audit.
