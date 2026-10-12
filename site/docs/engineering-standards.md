# Engineering Standards

read_when: changing the site's tooling, dependencies, TypeScript or ESLint
policy, tests, CI, or MCP configuration.

This is the canonical engineering baseline for the `pdd-kit.dev` site in
`site/` of `itai-gendler/pdd-kit`. The site is generated as static files (see
[ADR-0022](./adr/0022-a-static-site-in-the-pdd-kit-repository.md)); nothing
here runs per request.

## Runtime and package policy

- The site is the pnpm workspace member `pdd-kit-site`, beside the CLI package
  at the repository root and `viewer/app`. It depends on
  `@itai-gendler/pdd-kit` as `workspace:*`, and its report viewer and theme
  Layers resolve to that checkout's source.
- Node.js `>=22.12.0` is supported. CI uses Node 24; later Node releases are
  acceptable locally when the full gate passes.
- The root `packageManager` pins pnpm. Use Corepack or that exact pnpm version;
  do not regenerate the lockfile with another package manager.
- CI installs with `pnpm install --frozen-lockfile`. A dependency change includes
  the reviewed `package.json` and root `pnpm-lock.yaml` changes together.
- A package imported by page, server-route, or build-time code is a direct
  `dependency`. Test runners, linters, generators, and developer-only tools are
  `devDependencies`. Do not rely on a transitive package for a direct import.
- Exact pins are reserved for deliberately reproducible tools and known
  compatibility constraints. Ordinary libraries use the repository's existing
  semver policy; pnpm overrides in `pnpm-workspace.yaml` explain the constraint
  beside the override.

## Scripts

Run these from `site/`:

| Script | What it does |
| --- | --- |
| `pnpm blueprints` | builds every `blueprints/<slug>/` into `.data/blueprints` with the release script |
| `pnpm dev` | prepares Blueprints, then starts the Nuxt dev server |
| `pnpm generate` | prepares Blueprints, then writes the static site to `.output/public` |
| `pnpm preview` | serves the generated output locally |

## Quality gates

`pnpm typecheck` runs both Nuxt's generated app/server/shared/node projects and
the TypeScript tooling/test project. Existing executable scripts are ES modules
and are linted plus exercised through their owning integration tests; new
script modules with non-trivial typed interfaces should use TypeScript and are
covered by `tsconfig.tooling.json`.

`.github/workflows/site.yml` runs the gates in this order on every pull request
and push to `main` that touches the site or anything it renders (`docs/`,
`CHANGELOG.md`, `blueprints/`, `layers/`, `src/`), then uploads the generated
site as a build artifact.

| Command | CI | Contract |
| --- | --- | --- |
| `pnpm editorconfig` | yes | whitespace, encoding, line endings, final newlines |
| `pnpm lint` | yes | one flat ESLint policy for editor and CI |
| `pnpm typecheck` | yes | Nuxt plus tooling/test type safety |
| `pnpm knip` | yes | no unexplained unused files, exports, or dependencies |
| `pnpm test:integration` | yes | Vitest behavior and boundaries |
| `pnpm generate` | yes | the whole site generates, with every prerendered route succeeding |
| `pnpm test:e2e` | yes | Chromium/mobile/WebKit behavior and axe accessibility, against the generated site served statically |
| `pnpm performance:check` | manual | page and asset budgets |

`pnpm editorconfig` pins `EC_VERSION`. The npm package is a thin wrapper that
downloads the Go binary from the checker's **latest** GitHub release on first
run, matching an asset named `ec-<os>-<arch>`. Upstream's v4.0.0 renamed every
asset to `editorconfig-checker-<os>-<arch>`, so an unpinned wrapper asks for a
name that release does not have and the gate fails on any machine without a
warm cache — which is every CI runner. Pinning the tag also means the gate
cannot change its own rules underneath a green branch. Raise it deliberately.

## ESLint and import boundaries

`eslint.config.mjs` extends the Nuxt flat configuration once and adds only
site-owned policy:

- generated/build/test-artifact directories are ignored explicitly;
- `app/` may import client-safe code from `shared/`, never `server/` or H3;
- `server/` may not depend on the Nuxt application layer;
- `shared/` may not depend on app, server, or request-runtime modules.

`server/` holds only the build-time routes Nitro prerenders (the Blueprint data
files, the feeds, and the sitemap) and their helpers. Tests may cross these
boundaries to exercise real units.

`nuxt/nuxt-config-keys-order` is disabled because `@nuxt/eslint-plugin` 1.16
throws while visiting a valid top-level `watch` key. Re-enable the rule on a
future plugin update only after `pnpm exec eslint nuxt.config.ts --rule
'nuxt/nuxt-config-keys-order:error'` completes normally.

Do not add a blanket ESLint disable. A narrow override names its file set, the
incompatible rule, the reason, and a removal condition.

## Knip exception policy

Knip models root config, Nuxt app/server/shared code, scripts, and every test.
Package scripts and framework plugins discover ordinary entry points. The only
manual entries are runtime conventions static analysis cannot see:

| Entry | Why it is invisible |
| --- | --- |
| `content.config.ts` | Nuxt Content loads it by filename. |
| `app/components/content/*.vue` | Nuxt Content resolves prose overrides and MDC components by name. |
| `app/composables/usePddKitBackgroundVariant.ts` | The extended theme-lab layer calls the site's override through Nuxt auto-import resolution. |

The only ignored dependencies are `@iconify-json/logos` and
`@iconify-json/simple-icons`: Nuxt Icon discovers those packages at build time
from string icon names. Direct H3 imports are declared through the `h3`
dependency instead of hidden by Knip.

Every new ignore must be added to this table with its runtime consumer and a
way to prove it is still needed. Review the table whenever Knip or the owning
Nuxt module changes; removing an exception and running `pnpm knip` is the test.

## MCP policy

The repository's `.mcp.json` configures optional developer tools only. Builds,
tests, and CI never require an MCP server.

- Chrome DevTools MCP attaches to a browser on loopback port `9222`. Start a
  dedicated non-personal browser profile with remote debugging there, and check
  it with `curl --fail http://127.0.0.1:9222/json/version` before starting the
  MCP client.
- Nuxt UI's provider-hosted HTTP endpoint is useful for component documentation.
  It has no project-side version pin, so treat availability and responses as
  advisory and verify changes in source and tests.
- Configuration contains no tokens, cookies, or user-specific paths. A future
  credential uses an environment-variable placeholder and must remain optional.

## Ownership

The pdd-kit maintainers own this document and the configurations it names.
Update it in the same pull request when a runtime, gate, exception, boundary,
or MCP decision changes.
