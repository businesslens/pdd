# System Architecture

read_when: changing how the site is built, where its content comes from, or
what the generated output contains.

`pdd-kit.dev` is one Nuxt 4 application in `site/` of `itai-gendler/pdd-kit`,
generated with `nuxt generate` into static files. Nothing runs per request:
there is no server, database, account, API, or health endpoint. That is a
decision, recorded in
[ADR-0022](../../adr/0022-a-static-site-in-the-pdd-kit-repository.md). Anything
that would need a request-time decision does not belong on this site.

## The pieces

| Layer | What it is |
| --- | --- |
| Pages | `app/pages` — home, docs, blog, changelog, FAQ, Blueprints, contact, privacy |
| Content | Nuxt Content 3; blog posts from `site/content/blog`, docs, FAQ and changelog from the repository root |
| Blueprint data | `.data/blueprints`, built from the repository's `blueprints/` before every dev server and build |
| Build-time routes | `server/routes` — the Blueprint data files, the two RSS feeds, and the sitemap, all prerendered |
| Layers | the report viewer and theme Layers from the same checkout's source |
| Output | `.output/public` — HTML, payloads, feeds, and assets for any static host |

## Build pipeline

`pnpm generate` runs two steps:

1. `pnpm blueprints` (`scripts/prepare-blueprints.mjs`) runs the root
    `scripts/blueprints-release.mjs` into `site/.data/blueprints`. It is the same
    build that publishes the `blueprints-v<major>` GitHub Release that
    `pdd-kit blueprint pull` reads, so the site and the CLI show the same
    Blueprints. It then records each Blueprint's first and last commit dates
    from Git for the cards and the feed, which is why CI checks out full history.
2. `nuxt generate` prerenders every route. The crawler starts at `/` and
    follows links, which reaches every doc, post, and Blueprint; the feeds and
    sitemap are named explicitly because no page links them as HTML. A failed
    route fails the build.

`pnpm dev` runs the same Blueprint step first, then the dev server.

## Data sources

All content is read from the checkout the site is built in, so a change and the
page that shows it land in one pull request:

- **Docs and FAQ** from the repository's `docs/` (the FAQ is `docs/faq.md`).
  Images in `docs/images` are served at `/docs/images` rather than copied.
- **Changelog** from the repository's `CHANGELOG.md`.
- **Blog** from `site/content/blog`.
- **Blueprints** from `.data/blueprints`, as above.
- **Version badge** from the root `package.json`, so the header names the
  pdd-kit release the site ships beside.

## Blueprint data flow

- `server/routes/_data/blueprints.json` returns the catalog cards, and
  `server/routes/_data/blueprints/[slug].json` returns one Blueprint with its
  whole Product Report. Both read `.data/blueprints` through Nitro server
  assets and are prerendered into the page payloads; nothing reads them at
  request time.
- Logos, covers, and reports are served as static files under `/_blueprints/`.
- `server/routes/blueprints/rss.xml.get.ts` and
  `server/routes/blog/rss.xml.get.ts` generate the two feeds with the
  deterministic renderer in `server/utils/rssXml.ts`.
- A Blueprint's identity is its slug. Merging a contribution pull request
  publishes it: CI rebuilds the release and the site. There is no listing flag
  or withdrawal; deleting the directory removes it on the next build.

## In the browser

Two things happen after the page loads, and both are optional:

- The header's GitHub star count is fetched from `api.github.com` once per
  visit. If it fails, the badge renders without a count.
- PostHog analytics loads only when the build was generated with
  `NUXT_PUBLIC_POSTHOG_KEY`, stays cookieless until a visitor accepts, and is
  anonymous. See [analytics](../../analytics.md).

## Static output

`.output/public` is hosting-agnostic. Pages are written as `faq.html`, not
`faq/index.html`, because static hosts serve that file at the slashless URL
every link and the sitemap use, where a directory index would be redirected to
`/faq/`. CI (`.github/workflows/site.yml`) uploads the generated directory as a
build artifact; the Playwright suites run against it served statically.

## Related

- [Routing and naming](./routing-and-naming.md)
- [Engineering standards](../../engineering-standards.md)
