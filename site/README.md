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
starts Nuxt on `NUXT_PORT` (3200 by default). Edits under `../docs` and to
`../CHANGELOG.md` hot-reload. Run `pnpm blueprints` again after changing a
Blueprint.

## Build

```bash
pnpm generate
pnpm preview
```

`pnpm generate` writes the whole site to `.output/public`: one HTML file per
page (`faq.html`, served at `/faq`), the RSS feeds, the sitemap, and each
Blueprint's report, logo and cover under `/_blueprints`. Nothing runs per
request, so any static host can serve it.

Analytics is configured at build time. Set `NUXT_PUBLIC_POSTHOG_KEY` (and
`NUXT_PUBLIC_POSTHOG_HOST` for a non-EU project) when generating a deployed
build; without it the PostHog client never loads.

## Deploy

The site is served by Cloudflare Pages (project `pdd-kit`, production branch
`main`). `.github/workflows/site.yml` deploys it once every check passes:

- A pull request from this repository deploys the tested build to a preview
  URL, linked from the pull request. Previews have no analytics.
- `main` generates again with the PostHog key and deploys to pdd-kit.dev.

It needs the repository secrets `CLOUDFLARE_API_TOKEN` (an account token with
Cloudflare Pages: Edit) and `CLOUDFLARE_ACCOUNT_ID`, and the repository variable
`NUXT_PUBLIC_POSTHOG_KEY`. Response headers, including the policy that stops a
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
to what it renders, and uploads the generated site as an artifact.

The repository's runtime, dependency and quality-gate policy for the site is in
[`docs/engineering-standards.md`](./docs/engineering-standards.md); its design
documentation starts at [`docs/design/README.md`](./docs/design/README.md), and
[ADR-0022](./docs/adr/0022-a-static-site-in-the-pdd-kit-repository.md) records
why it is static.
