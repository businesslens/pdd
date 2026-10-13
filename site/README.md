# pdd-kit.dev

The [pdd-kit.dev](https://pdd-kit.dev) site: the home page, the documentation,
the FAQ, the changelog, the blog and the Blueprints. It is generated as static
files from this repository, so a change to the docs, a Blueprint or the report
viewer and the page that shows it land in one pull request.

| What | Read from |
| --- | --- |
| Pages, blog, components | `site/` |
| Docs and FAQ | `../docs` |
| Changelog | `../CHANGELOG.md` |
| Blueprints | `../blueprints`, built by `pnpm blueprints` |
| Report viewer and theme | `../layers/nuxt` |

## Stack

Nuxt 4 · Nuxt UI v4 · Nuxt Content 3 · Tailwind CSS 4 · Vitest · Playwright ·
pnpm, as the `pdd-kit-site` member of the repository's workspace.

## Local development

From the repository root, `pnpm install` once, then:

```bash
cd site
pnpm dev
```

`pnpm dev` first runs `pnpm blueprints`, which builds every Blueprint into
`.data/blueprints` with the same release script CI uses to publish them, then
starts Nuxt on its default port, 3000 (`NUXT_PORT` or `PORT` overrides it).
Edits under `../docs` and to `../CHANGELOG.md` hot-reload. Run
`pnpm blueprints` again after changing a Blueprint.

## Build

```bash
pnpm generate
pnpm preview
```

`pnpm generate` writes the whole site to `.output/public`: one HTML file per
page (`faq.html`, served at `/faq`), the RSS feeds, the sitemap, and each
Blueprint's report, logo and cover under `/_blueprints`. Nothing runs per
request, so any static host can serve it.

## Deploy

The site is served by Cloudflare Pages (project `pdd-kit`, production branch
`main`). `.github/workflows/site.yml` builds the site once and deploys that
build: a pull request from this repository to a preview URL linked from the pull
request as soon as the build and static checks pass, while the e2e tests still
run, and `main` to pdd-kit.dev only once the e2e tests pass too.

It needs the repository secrets `CLOUDFLARE_API_TOKEN` (an account token with
Cloudflare Pages: Edit) and `CLOUDFLARE_ACCOUNT_ID`. Response headers, including the policy that stops a
contributed Blueprint logo from running scripts, are in `public/_headers`.

## Verification

```bash
pnpm editorconfig
pnpm lint
pnpm typecheck
pnpm knip
pnpm test:integration
pnpm test:e2e     # generates, then runs Playwright against the static files
```

`.github/workflows/site.yml` runs the same steps on every change to the site or
to what it renders: a `build` job for the static checks and the generated site,
then an `e2e` job in Playwright's container image, split across three runners. Its
`site` job is the check branch protection requires; it passes when the change
cannot affect the site.

Further reading:

- [Architecture](./docs/architecture.md): build, routes, catalog, hosting and
  product constraints.
- [Brand and UI](./docs/brand.md): colour, type, assets, home page and shared UI
  rules.
- [Engineering standards](./docs/engineering-standards.md).
- [ADR-0001](./docs/adr/0001-a-static-site.md) records why the site is static.
