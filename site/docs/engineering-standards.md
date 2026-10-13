# Engineering Standards

read_when: changing the site's tooling, dependencies, TypeScript or ESLint
policy, tests or CI.

The engineering baseline for the `pdd-kit.dev` site in `site/`. The site is
generated as static files (see [ADR-0001](./adr/0001-a-static-site.md)); nothing
here runs per request.

## Runtime and packages

- The site is the pnpm workspace member `pdd-kit-site`. It depends on
  `pdd-toolkit` as `workspace:*`, and its report viewer and theme
  Layers resolve to that checkout's source.
- Node.js `>=22.12.0`. CI uses Node 24.
- The root `packageManager` pins pnpm. Do not touch the lockfile with another
  package manager. CI installs with `pnpm install --frozen-lockfile`; a
  dependency change ships `package.json` and the root `pnpm-lock.yaml` together.
- A package imported by page, server-route or build-time code is a
  `dependency`; test runners, linters and developer tools are
  `devDependencies`. Never rely on a transitive package for a direct import.

## Scripts

Run from `site/`:

| Script | What it does |
| --- | --- |
| `pnpm blueprints` | builds every `blueprints/<slug>/` into `.data/blueprints` with the release script |
| `pnpm dev` | `pnpm blueprints`, then `nuxt dev` |
| `pnpm generate` | `pnpm blueprints`, then `nuxt generate` into `.output/public` |
| `pnpm preview` | serves the generated output locally |
| `pnpm test` | `test:integration`, then `test:e2e` |

## Quality gates

`.github/workflows/site.yml` runs these on every pull request and push to
`main` that touches the site or anything it renders (`docs/`, `CHANGELOG.md`,
`blueprints/`, `layers/`, `src/`, `viewer/`). The `static` job runs the checks
up to `pnpm test:integration`; beside it, the `build` job runs `pnpm generate`,
reusing a cached CLI build (`dist/`) when none of its sources changed, and
uploads the generated site and the CLI build; the `e2e` job runs Playwright
against them in the Playwright container image, split across three runners
with two workers each and scheduled test by test. Keep that image's tag equal to `@playwright/test`; Renovate
updates both in one pull request. The required `site` check passes when the
change cannot affect the site.

The same gates run locally before each commit through Lefthook
(`lefthook.yml`), each only when a staged file can affect it.

| Command | CI | Contract |
| --- | --- | --- |
| `pnpm editorconfig` | yes | whitespace, encoding, line endings, final newlines |
| `pnpm lint` | yes | one flat ESLint policy (`pnpm lint:fix` to apply fixes) |
| `pnpm typecheck` | yes | Nuxt app/server/shared projects (`typecheck:nuxt`) plus tooling and tests (`typecheck:tooling`, `tsconfig.tooling.json`) |
| `pnpm knip` | yes | no unexplained unused files, exports or dependencies |
| `pnpm test:integration` | yes | Vitest |
| `pnpm generate` | yes | every prerendered route succeeds |
| `pnpm test:e2e` | yes | Playwright (Chromium, mobile, WebKit) with axe, against the generated site served statically; locally it generates first |
| `pnpm performance:check` | manual | page and asset budgets |

`pnpm editorconfig` pins `EC_VERSION`, because the unpinned wrapper downloads a
release asset name upstream no longer publishes. Raise it deliberately.

## ESLint and import boundaries

`eslint.config.mjs` extends the Nuxt flat configuration once and adds only
site-owned policy:

- generated, build and test-artifact directories are ignored explicitly;
- `app/` may import client-safe code from `shared/`, never from `server/`;
- `server/` may not depend on the Nuxt application layer;
- `shared/` may not depend on `app/`, `server/` or request-runtime modules.

`server/` holds only the build-time routes Nitro prerenders (Blueprint data,
feeds, sitemap) and their helpers. Tests may cross these boundaries.

`nuxt/nuxt-config-keys-order` is off because `@nuxt/eslint-plugin` 1.16 crashes
on the valid top-level `watch` key. Re-enable it once
`pnpm exec eslint nuxt.config.ts --rule 'nuxt/nuxt-config-keys-order:error'`
completes normally.

No blanket ESLint disables. A narrow override names its files, the rule, the
reason and a removal condition.

## Knip

`knip.json` lists the project files Knip analyses, plus manual `entry` points
and `ignoreDependencies` for what static analysis cannot see: files Nuxt
Content or Nuxt auto-imports load by name or convention (`content.config.ts`,
prose and MDC components under `app/components/content/`), and packages used in ways Knip does not trace,
such as the `@iconify-json/*` icon sets Nuxt Icon discovers from string icon
names at build time. Package scripts and framework plugins discover everything
else; read `knip.json` for the current list.

Keep every exception justified by a runtime consumer. Removing it and running
`pnpm knip` is the test that it is still needed.
