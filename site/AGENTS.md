# AGENTS.md — site/

The pdd-kit.dev site. The repository's own `AGENTS.md` still applies; this file
adds what is specific to `site/`.

## What the site is

- A static Nuxt site, generated with `nuxt generate` into `.output/public`.
  There is no server, database, account, mailing list or request-time logic,
  and nothing may add one: see [ADR-0001](./docs/adr/0001-a-static-site.md).
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
  written out on first use on a page. The retired product name must not
  reappear anywhere in the repository; `pnpm check` (`scripts/check-repo.mjs`)
  fails if it does. Do not reintroduce `Hub`, `Platform`, `Explore`,
  `Product Model Version` or `Blueprint Revision` either.

## Locations

- `app/` — pages, components, composables, layouts, assets.
- `server/` — build-time routes only: feeds, sitemap, Blueprint data.
- `shared/` — types and helpers shared by `app/` and `server/`.
- `content/blog/` — blog posts. `public/` — static assets.
- `tests/integration/` (Vitest), `tests/e2e/` (Playwright, against the
  generated site), `tests/support/`.
- `docs/` — [architecture](./docs/architecture.md) (build, routes, catalog,
  hosting, product constraints), [brand and UI](./docs/brand.md),
  [engineering standards](./docs/engineering-standards.md), and `adr/`.

## Frontend

- Nuxt UI v4 is the component library. Reach for it before hand-rolling.
- Brand tokens and the stable identity live in the theme Layer
  (`../layers/nuxt/theme`); site styles in `app/assets/css`. See
  [`docs/brand.md`](./docs/brand.md) before changing colors, typography, home
  page copy or marketing voice.
- Anything that varies per visitor (the header's GitHub star count) runs in
  the browser after hydration; the generated HTML is the same for everyone.
- The only analytics is Cloudflare Web Analytics (cookie-free page views,
  enabled on the Pages project; see ADR-0001), and there is no consent notice.
  Do not add other tracking without a new ADR.

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
