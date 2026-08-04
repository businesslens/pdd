# OSS local Product Report viewer

## Status

Approved for implementation on 2026-08-03. Updated on 2026-08-04 to make the
report the only Product-facing Blueprint source, add event-driven local updates,
and adopt the optional shared theme lab described in
[`shared-theme-lab.md`](./shared-theme-lab.md).

## Outcome

BusinessLens users can run:

```bash
npx businesslens view
```

The command compiles the repository's current `.businesslens/` Product Model
into a workspace Product Report, starts a read-only loopback server, and opens a
local browser visualization. The public Blueprint record and the local viewer
render through the same OSS report component.

The renderer, stable BusinessLens theme, and optional experimental theme lab
live as Nuxt Layers in the single `businesslens` package. The landing
application remains authoritative over its catalog behavior, marketing shell,
and host-only experiments; both hosts share undecided backgrounds and brand
presentation through the lab.

## Architecture

```text
Product Report v7
        |
        v
businesslens/report/view-model
        |
        v
businesslens/nuxt/report-viewer: structure and behavior
businesslens/nuxt/theme: BusinessLens-wide visual foundation
businesslens/nuxt/theme-lab: optional shared presentation experiments
        |
        +--------------------------+
        |                          |
        v                          v
businesslens.io              businesslens view
landing-owned host           PDD-owned local host
```

### Ownership

| Concern | Owner |
| --- | --- |
| Product Report schema and compilation | `businesslens` |
| Report view-model projection | `businesslens/report/view-model` |
| Report markup, interaction, responsive behavior, and accessibility | `businesslens/nuxt/report-viewer` |
| Stable shared BusinessLens theme | `businesslens/nuxt/theme` |
| Shared background, mark, lockup, favicon, and their experiment controls | `businesslens/nuxt/theme-lab` |
| Landing-only experiments | landing |
| Catalog API, database, listing state, SEO, errors, pull CTA, and source provenance | landing |
| Loopback server, browser opening, and local diagnostics | `businesslens` CLI |

The core renderer uses semantic UI roles such as default, dimmed, primary,
elevated, and border. It must not own concrete BusinessLens palette values,
global fonts, color-mode policy, marketing backgrounds, or application chrome.

## PDD implementation

### 1. Root-package report APIs and Nuxt Layers

Add these exports to the existing `businesslens` npm package:

- `businesslens/report/view-model` for the pure `projectReportView` function and
  its public types;
- `businesslens/nuxt/report-viewer` for the report renderer Layer; and
- `businesslens/nuxt/theme` for the sibling global theme Layer; and
- `businesslens/nuxt/theme-lab` for optional shared presentation experiments.

The core component accepts a `ReportViewModel`, a controlled active section, a
Nuxt-UI-style `ui` override object, one host-resolved `logoSrc`, and slots for
navigation, the primary host action, and provenance. It deliberately has no
title, description, badge, or other Product-presentation overrides.

The initial component preserves the existing Blueprint record experience:

- header, description, and stats;
- Overview with intent, Actors, Capabilities, and limitations;
- Journeys;
- Business Rules and Scenarios; and
- responsive and accessible tab behavior.

Entities use stable report IDs as render keys. Catalog operational state such as
listing, featured rank, digest, and source commit does not enter the report
model. Blueprint title, summary, description, category, tags, authors, license,
statistics, and semantic identity always come from the report itself. Visual
identity has one source: `.businesslens/logo.svg`. It is served from disk by the
local host and from the pinned official GitHub source by the catalog host. The
shared logo component uses a packaged neutral placeholder when that optional
local asset is absent or any resolved source fails to load.

### 2. Shared BusinessLens-wide theme

The theme Layer contains the stable palette, Nuxt UI semantic color mapping,
typography, selection treatment, scrollbar treatment, and base host surfaces.
It excludes marketing hero styling, experiments, page-specific animation, and
site header/footer styling. The optional theme-lab Layer extends it with the
currently undecided backgrounds and brand presentation; it does not own either
host's navbar.

The theme is not scoped beneath the report renderer. The localhost viewer and
landing consume it independently and may override it through higher-priority
project files.

### 3. Standalone viewer application

Create a private Nuxt SPA under `viewer/app` that extends the report viewer and
theme-lab Layers. It fetches
only a same-origin `/_businesslens/report.json`, renders the shared component,
uses the same query-string section state, and shows structured compilation or
validation failures.

It has a controlled production-like shell with the BusinessLens brand and PDD
version, repository, color mode, View docs, and theme-lab toggle. It has no CDN,
telemetry, or automatic requests to report references. Generate it during the
release build and copy its static output into the `businesslens` CLI package.

### 4. CLI command

Extract a non-writing `compileWorkspaceReport(cwd)` primitive from the Blueprint
export path. `blueprint export` applies the portable projection and writes the
generated report; `view` serves the workspace-profile report without writing.

Add:

```text
businesslens view
businesslens view --no-open
businesslens view --port <port>
businesslens --cwd <path> view
```

The runtime server:

- binds only to `127.0.0.1`;
- selects an ephemeral port by default;
- validates the Host header;
- serves only packaged viewer assets, health, the report endpoint, the optional
  validated Product logo, and the same-origin event stream;
- watches canonical model sources and recompiles once after debounced edits;
- streams report and compilation-error events to open browsers over same-origin SSE;
- retains the last valid report while an intermediate edit fails lint;
- sets `Cache-Control: no-store`, a restrictive CSP, and no CORS;
- exposes no arbitrary filesystem route;
- executes no target code and writes no repository files;
- handles SIGINT and SIGTERM cleanly; and
- opens the browser unless `--no-open` is present.

### 5. Packaging and release

Keep Nuxt, Vue, Nuxt UI, Tailwind, Playwright, and font tooling out of the
`businesslens` package's runtime dependencies. They are build dependencies of
the private workspace viewer and consuming Nuxt hosts. Pack and publish only
`businesslens`, and smoke-test its CLI and Nuxt Layer exports.

The packed CLI smoke test must start `view --no-open`, fetch health, viewer HTML,
the report endpoint, and the logo endpoint, then terminate the process. Add a
package-size budget.

### 6. PDD tests and documentation

Add tests for projection, component states, local routes, loopback binding,
Host rejection, security headers, invalid models, no-write behavior, explicit
ports, browser-open suppression, shutdown, and the packed artifact.

Add CLI documentation, README usage, changelog entries, package README, and the
required repository/release checks.

## Landing implementation

### 1. Consume the package

Link the PDD root during development and install the published `businesslens`
package in release builds. Extend the report-viewer and theme Layers. Landing stays
the higher-priority Nuxt project and therefore remains free to override shared
configuration, CSS, components, and `ui` slots.

### 2. Refactor the record projection

The Blueprint record response becomes:

```ts
{
  report: projectReportView(storedReport),
  blueprint: {
    slug,
    reportDigest,
    source
  }
}
```

The listing-card projection remains landing-owned and keeps loading no full
reports, but it is produced only from the report and source provenance at
publish time. There is no `blueprint.yaml` and no catalog-specific Product title,
summary, category, tag, author, or per-Blueprint license field. The Product logo
URL is derived from the Blueprint's pinned source rather than duplicated as
metadata. The Product ID is the catalog slug; the repository-wide license and catalog operational state remain
outside the model. Delete duplicated client/server report record types and
report flattening once the shared projection is in use.

### 3. Make the Blueprint page a host

The page retains catalog fetching, honest 404/503 responses, SEO, query-string
section state, navigation, the pull CTA, and provenance. It supplies those host
areas through the shared component's props and slots.

The catalog CTA uses the canonical command:

```bash
npx businesslens blueprint pull <slug>
```

It must describe the current PDD behavior: pull writes inside `.businesslens/`
and does not write a root `AGENTS.md`.

### 4. Landing design ownership

Remove only stable token and theme definitions now provided identically by the
optional theme. Keep all marketing CSS, background variants, preview tooling,
site chrome, and landing-only overrides in landing. A local landing override
must take effect without a PDD change.

### 5. Landing tests

Preserve Blueprint SSR behavior, 404/503 handling, shareable sections, pull CTA,
provenance, light/dark and mobile accessibility, and the screenshot catalog.
Render one fixture through both hosts and compare the report region, excluding
their intentionally different shells.

Before deployment, re-publish or re-seed catalog rows and assert that every
live report is Product Report v7. The shared projection intentionally does not
restore v4/v5/v6 compatibility; stale rows must be replaced as rollout data, not
normalized indefinitely in the rendering package.

## Delivery order

1. Establish current catalog behavior and a complete v7 projection fixture.
2. Build and test the pure view model and theme-neutral report-viewer Layer in PDD.
3. Extract and test the sibling global theme Layer.
4. Migrate landing against the linked root package and remove duplicated renderer code.
5. Build the standalone SPA and loopback CLI server.
6. Add packaging, artifact smoke tests, documentation, and release automation.
7. Run full verification in both repositories.
8. Publish only `businesslens`, pin that version in landing, refresh any pre-v7
   catalog rows, and deploy.

## Definition of done

- `businesslens view` opens a valid local Product Model in a browser.
- The Blueprint page and localhost use the same OSS projection and component.
- Shared styling is available through an optional theme Layer.
- Landing can override every shared visual decision without forking the renderer.
- Landing contains no duplicated report markup or record projection logic.
- The CLI installs no Nuxt runtime toolchain.
- The local server is loopback-only, read-only, offline, and telemetry-free.
- Catalog accessibility, pull behavior, and deployment guarantees remain intact.
- Blueprint cards and record headers cannot drift from the report they deliver.
- Open local viewers update automatically after valid model edits without polling.

## Follow-up, not part of the extraction

After parity ships, expand the shared renderer to Interfaces, Experiences,
Screens, Domains, availability, detailed Scenario flows, Rule rationale and
relationships, Coverage, References, and supporting content. Each enhancement
then lands once and appears in both hosts.
