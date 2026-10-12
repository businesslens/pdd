# Routing and Naming

read_when: adding a route, renaming one, or choosing a URL for anything public.

## The route families

Every route is generated at build time; none needs anything at request time.

| Family | Routes | Source |
| --- | --- | --- |
| Marketing | `/`, `/contact`, `/faq` | site pages; the FAQ from the repository's `docs/faq.md` |
| Legal | `/privacy` | site page |
| Documentation | `/docs/**` | the repository's `docs/` |
| Writing | `/blog`, `/blog/rss.xml`, `/blog/:slug` | `site/content/blog` |
| Changelog | `/changelog` | the repository's `CHANGELOG.md` |
| Catalog | `/blueprints`, `/blueprints/rss.xml`, `/blueprints/:slug` | the repository's `blueprints/`, built into `.data/blueprints` |

Plus `/sitemap.xml`, and the build internals `/_data/blueprints.json`,
`/_data/blueprints/:slug.json` (prerendered into page payloads) and
`/_blueprints/**` (Blueprint logos, covers, and reports).

Public URLs are slashless. Pages are generated as `faq.html` rather than
`faq/index.html`, because static hosts serve that file at `/faq`, where a
directory index would be redirected to `/faq/`. Canonical links, the sitemap
and the feeds all use the slashless form.

`/blog/rss.xml` and `/blueprints/rss.xml` are XML routes within their families.
Readers save these URLs into clients, so they do not move or gain a version
segment. Both are generated with the site. Neither is a sitemap page.

## Naming rules

- **One noun per concept, taken from [`CONTEXT.md`](../../../CONTEXT.md).** A
  Blueprint is a Blueprint in the URL, in the directory name, in the CLI, and
  in the copy.
- **Plural collections, singular records.** `/blueprints` lists;
  `/blueprints/:slug` is one.
- **A Blueprint's identity is its slug** — its `blueprints/<slug>/` directory,
  its page, its feed item and its pull name. See
  [ADR-0022](../../adr/0022-a-static-site-in-the-pdd-kit-repository.md).
- **State that a URL should carry goes in the query string.** The Blueprint
  record's tab lives in `?tab=`, so a record view is shareable and a reload
  lands where it was shared from. The default tab is spelled by the *absence* of
  the parameter, never by naming it. The listing's search and category live in
  `?q=` and `?category=` on `/blueprints`, written with `replace` so typing does
  not fill the history; see
  [ADR-0019](../../adr/0019-the-catalog-index-has-one-layout.md).
- **Removed paths are not generated**, so a static host answers 404 for them.
  Publication alone does not justify keeping an obsolete route.

## Retired paths

These paths are not generated and answer 404:

| Removed | Current destination for new links |
| --- | --- |
| `/hub` | `/blueprints` |
| `/platform` | `/blueprints` |
| `/about`, `/about/**` | `/` |
| `/community` | `/` |
| `/platform/changelog` | `/changelog` |
| `/changelog/platform` | `/changelog` |
| `/docs/platform`, `/docs/platform/**` | `/docs` |
| `/login`, `/settings`, `/settings/**`, `/admin`, `/admin/**` | none; the site has no accounts |
| `/api/**` | none; `blueprint pull` reads the GitHub Release |
| `/blog/product-driven-design`, `/blog/product-driven-development`, `/blog/the-missing-standard-for-product-knowledge` | `/blog/your-agent-is-guessing` |

The retired vocabulary belongs only in historical records and removed-route
coverage. Do not reintroduce those concepts in current product behavior.

## Adding a route

1. Pick the noun from `CONTEXT.md` before writing the file name.
2. Make sure it can be generated: a link from a generated page reaches it, or
    it is named in `nitro.prerender.routes`. Anything that needs a request-time
    decision does not belong on this site.
3. Add its Playwright coverage, including the axe scan every page suite runs.
