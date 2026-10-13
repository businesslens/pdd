# Architecture

read_when: changing how the site is built, where its content comes from, what a
route is called, what the catalog does, or whether something belongs on the
site at all.

`pdd-kit.dev` is one Nuxt 4 application in `site/`, generated with
`nuxt generate` into static files. Nothing runs per request: no server,
database, account, API or health endpoint. See
[ADR-0001](./adr/0001-a-static-site.md).

## Product constraints

A future change must not quietly reverse these:

- **Pulling is anonymous.** No account, credential or token in front of
  `pdd-kit blueprint pull`.
- **Nothing runs per request.** Every page, feed and data file is generated at
  build time.
- **The site and the CLI show the same Blueprints.** Both are built from the
  repository's `blueprints/` by one release script.
- **Every visitor gets the same page.** No per-viewer content in the generated
  HTML; the GitHub star count runs in the browser after hydration.
- **Workspace material never reaches the catalog.** The portable report carries
  no implementation References, code References, repository-relative targets or
  source areas.
- **Public and internal terminology agree.** The owning Product Model pages in
  the repository's `docs/` and [`CONTEXT.md`](../CONTEXT.md) use one vocabulary.

### Not in this product

- Pricing, billing, plans, trials, waitlists.
- Accounts, workspaces, teams, invitations, API keys, favorites.
- A server, a database, email or a mailing list.
- Blueprint lifecycle beyond the directory: a Blueprint is a directory, and
  merging a change to it replaces it.

A proposal that reintroduces one of these needs an ADR, not a quiet pull
request. A new noun needs a `CONTEXT.md` entry first.

## Pieces

| Layer | What it is |
| --- | --- |
| Pages | `app/pages`: home, docs, blog, changelog, FAQ, Blueprints, contact, privacy |
| Content | Nuxt Content 3: blog from `site/content/blog`; docs, FAQ and changelog from the repository root |
| Blueprint data | `.data/blueprints`, built from the repository's `blueprints/` |
| Build-time routes | `server/routes`: Blueprint data, the two RSS feeds, the sitemap; all prerendered |
| Layers | the report viewer and theme from `../layers/nuxt` |
| Output | `.output/public`: HTML, payloads, feeds and assets for any static host |

## Build

`pnpm generate` runs two steps:

1. `pnpm blueprints` (`scripts/prepare-blueprints.mjs`) runs the root
    `scripts/blueprints-release.mjs` into `.data/blueprints`, the same build
    that publishes the `blueprints-v<major>` GitHub Release. It then records
    each Blueprint's first and last commit dates from Git for the cards and the
    feed, which is why CI checks out full history.
2. `nuxt generate` prerenders every route. The crawler starts at `/` and
    follows links; the feeds, the sitemap and `/_data/blueprints.json` are named
    in `nitro.prerender.routes`. A failed route fails the build.

`pnpm dev` runs the same Blueprint step, then the dev server. Edits under
`../docs` and to `../CHANGELOG.md` hot-reload.

## Data flow

- `server/routes/_data/blueprints.json` returns the catalog cards;
  `server/routes/_data/blueprints/[slug].json` returns one Blueprint with its
  Product Report. Both are prerendered into page payloads.
- Logos, covers and reports are static files under `/_blueprints/`.
- The two feeds use the deterministic renderer in `server/utils/rssXml.ts`.
- The header's version badge is the root `package.json` version, read at build
  time.
- In the browser, one optional thing happens: the GitHub star count is fetched
  from `api.github.com` (the badge renders without a count on failure).
  Cloudflare Pages adds its Web Analytics beacon, which records cookie-free
  page views; there is no other analytics.

## Content contract

- **Docs.** Nuxt Content reads the repository's `docs/**/*.md`, except
  `faq.md`, with a `/docs` prefix. Two optional frontmatter keys shape the
  sidebar: `group` (the cluster) and `order` (position within it). One
  navigation tree, no section tabs.
- **FAQ.** `docs/faq.md` is its own collection, excluded from docs: no docs
  sidebar entry, search result, `/docs/faq` page or duplicate sitemap URL.
  `shared/faq-content.ts` validates the parsed Markdown; malformed content fails
  the build rather than losing answers.
- **Changelog.** The root `CHANGELOG.md`, rendered as-is. Each dated `##`
  release is one card; `[Unreleased]` and empty releases are skipped. A
  missing file fails the prerender.
- **Blog.** `site/content/blog`; `date` and `image` are required so every post
  has a card that renders.
- Generation fails on an internal link to a doc that does not exist in the same
  checkout.

## Catalog

| Actor | Can | Needs |
| --- | --- | --- |
| Visitor | browse Blueprints, open a record, copy the pull command | nothing |
| Puller | `pdd-kit blueprint pull <slug>` | nothing |
| Contributor | `pdd-kit blueprint contribute`, which opens a pull request | a GitHub account |
| Maintainer | merge the pull request, which publishes the Blueprint | write access |

- **Identity is the slug**: the `blueprints/<slug>/` directory, the page, the
  feed item and the pull name. Deleting the directory removes it on the next
  build; there is no listing flag or withdrawal.
- **Listing.** `/blueprints` is one flat list, the same HTML for everyone;
  search and category filter in the browser. See
  [ADR-0003](./adr/0003-the-catalog-index.md).
- **Record.** `/blueprints/:slug` renders the Product Report into the generated
  page; the pull command is the point of its Overview. An unknown slug is a 404.
- **Pull.** `pdd-kit blueprint pull` downloads the report from the GitHub
  Release and expands it into `product-model/`. The site is not involved.
- **Feed.** `/blueprints/rss.xml` lists every Blueprint, sorted by `updatedAt`
  descending, then slug. `pubDate` is the first commit touching the directory,
  `atom:updated` the latest. The GUID is the record URL. Removing a Blueprint
  removes its entry.

## Routes

| Family | Routes | Source |
| --- | --- | --- |
| Marketing | `/`, `/faq` | site pages; FAQ from `docs/faq.md` |
| Legal | `/privacy` | site page |
| Documentation | `/docs/**` | the repository's `docs/` |
| Writing | `/blog`, `/blog/rss.xml`, `/blog/:slug` | `site/content/blog` |
| Changelog | `/changelog` | the repository's `CHANGELOG.md` |
| Catalog | `/blueprints`, `/blueprints/rss.xml`, `/blueprints/:slug` | `.data/blueprints` |

Plus `/sitemap.xml`, `/404.html`, and the build internals `/_data/**` and
`/_blueprints/**`.

- **Slashless URLs.** Pages are written as `faq.html`, not `faq/index.html`
  (`autoSubfolderIndex: false`), because static hosts serve that file at
  `/faq`, where a directory index would redirect to `/faq/`. Links, canonical
  URLs, the sitemap and the feeds all use the slashless form. Never link a
  trailing-slash URL.
- **Feed URLs are permanent.** `/blog/rss.xml` and `/blueprints/rss.xml` are
  saved into readers; they do not move or gain a version segment. Neither is a
  sitemap page.
- **One noun per concept**, taken from `CONTEXT.md`. Plural collections,
  singular records: `/blueprints` lists, `/blueprints/:slug` is one.
- **URL state goes in the query string.** The record's section is `?tab=` (an
  open resource adds `?e=`), and the default tab is spelled by the parameter's
  absence. The listing's search and category are `?q=` and `?category=`,
  written with `replace`.
- **Removed paths are not generated**, so the host answers 404.

### Adding a route

1. Pick the noun from `CONTEXT.md` before naming the file.
2. Make sure it is generated: a link from a generated page reaches it, or it is
    listed in `nitro.prerender.routes`.
3. Add Playwright coverage, including the axe scan every page suite runs.

## Hosting

- Cloudflare Pages serves `.output/public`. `.github/workflows/site.yml` builds
  it once: a pull request from this repository deploys to a preview URL as soon
  as the build passes, while the e2e tests run, and `main` deploys to
  pdd-kit.dev only after they pass.
- `public/_headers` sets response headers: security headers on every path, a
  year's immutable cache on content-hashed `/_nuxt/*`, and a no-script,
  sandboxed policy on `/_blueprints/*` so a contributed logo or cover opened
  directly cannot run anything.
