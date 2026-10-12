# AGENTS.md — site/

The pdd-kit.dev site. The repository's own `AGENTS.md` still applies; this file
adds what is specific to `site/`.

## What the site is

- A static Nuxt site, generated with `nuxt generate` into `.output/public`.
  There is no server, database, account, mailing list or request-time logic,
  and nothing may add one: see
  [ADR-0022](./docs/adr/0022-a-static-site-in-the-pdd-kit-repository.md).
- It renders this repository: `../docs` (docs and `faq.md`), `../CHANGELOG.md`,
  and `../blueprints`, plus the report viewer and theme Layers in
  `../layers/nuxt`. Fix content where it is authored, not here.
- `pnpm blueprints` builds `.data/blueprints` with the root
  `scripts/blueprints-release.mjs`, the same build that publishes the Blueprint
  GitHub Release, so the site and `pdd-kit blueprint pull` agree. Pages read it
  through `server/routes/_data/**`, which are prerendered into page payloads.
- Pages are emitted as `name.html` and linked slashless (`/faq`). Never link a
  trailing-slash URL.

## Vocabulary

- [`CONTEXT.md`](./CONTEXT.md) is the internal glossary. Use its terms exactly.
- A **Product Model** is what you author, in `product-model/`; a **Blueprint**
  is a Product Model in the repository's `blueprints/`. Verbs: **contribute**
  (open a pull request with `pdd-kit blueprint contribute`), **publish** (merge
  it), **pull** (download it from the Blueprint release).
- The product is **pdd-kit**; the practice is Product-Driven Development,
  written out on first use on a page. Do not reintroduce `BusinessLens`,
  `Hub`, `Platform`, `Explore`, `Product Model Version` or `Blueprint Revision`
  outside historical records.

## Locations

- `app/` — pages, components, composables, layouts, assets.
- `server/` — build-time routes only: feeds, sitemap, Blueprint data.
- `shared/` — types and helpers shared by `app/` and `server/`.
- `content/blog/` — blog posts. `public/` — static assets.
- `tests/integration/` (Vitest), `tests/e2e/` (Playwright, against the
  generated site), `tests/fixtures/`.
- `docs/` — the site's design documentation (start at
  [`docs/design/README.md`](./docs/design/README.md)) and ADRs. An ADR is
  superseded only by a later ADR.

## Frontend

- Nuxt UI v4 is the component library. Reach for it before hand-rolling.
- Brand tokens and the stable identity live in the theme Layer
  (`../layers/nuxt/theme`); site styles in `app/assets/css`. See
  [`docs/design/foundation/brand-guidelines.md`](./docs/design/foundation/brand-guidelines.md)
  before changing colors, typography or marketing voice.
- Anything that varies per visitor (the analytics consent, the header's GitHub
  star count) runs in the browser after hydration; the generated HTML is the
  same for everyone.
- Analytics is PostHog, consent-gated, configured at build time with
  `NUXT_PUBLIC_POSTHOG_KEY`. It never identifies a person.

## Verification

Run from `site/` before handing work back:

```bash
pnpm editorconfig
pnpm lint
pnpm typecheck
pnpm knip
pnpm test:integration
pnpm test:e2e
```

- Every Playwright page suite runs an axe WCAG 2.0/2.1 A/AA scan. New pages must
  be violation-free.
- Run `pnpm performance:check` for performance-sensitive work.
- When the site's output changes, generate it and look at it: `pnpm generate`,
  then `pnpm preview`.
