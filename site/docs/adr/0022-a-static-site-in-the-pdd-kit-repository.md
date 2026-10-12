# A static site in the pdd-kit repository

Status: accepted, 2026-10-12.

read_when: adding anything to the site that would need a server, a database, an
account, or a request-time decision; or wondering why the site is in this
repository.

BusinessLens is now **pdd-kit**. The site moved from its own repository into
`site/` of the pdd-kit repository and is generated as static files for
`pdd-kit.dev`.

## Decision

- **No server.** `nuxt generate` writes every page, feed and data file at build
  time. Nothing on the site runs per request.
- **No accounts.** Sign-in, favorites, the account and settings pages, the
  administration pages and the mailing list are gone, with Better Auth,
  PostgreSQL, Drizzle, Resend, oRPC and the Helm chart behind them.
- **Blueprints come from the repository.** Each `blueprints/<slug>/` is built
  with the same release script that publishes the `blueprints-v<major>` GitHub
  Release `blueprint pull` reads, so the site and the CLI show the same
  Blueprints. Merging a contribution publishes it; there is no catalog server,
  listing flag or withdrawal.
- **Docs, FAQ and changelog are read from the checkout**, not fetched, so a
  change and the page that shows it land in one pull request.
- **Analytics is configured at build time** (`NUXT_PUBLIC_POSTHOG_KEY`), keeping
  its consent gate. There is no identity to attach to it.
- **Cloudflare Pages serves it**, deployed from GitHub Actions after the checks
  pass, with a preview URL per pull request. Response headers live in
  `public/_headers`.
- **No domain email.** The contact address is the maintainer's own.

## Why

A maintainer reviewing a PR that added the Product Model asked why a product's
own directory and vendor were in their repository. A format whose home is a
signed-in SaaS catalog reads as a vendor; a format with an open repository and a
static site reads as a standard. One maintainer also cannot keep a database,
auth provider, mail provider and Kubernetes release healthy alongside the
format itself.

## Consequences

- This supersedes ADR-0001 (OAuth from day one), ADR-0002 (Blueprint identity is
  the row), ADR-0003 (report.json is not edge-cached), ADR-0004 (catalog origin
  open for reads, locked for writes) and ADR-0013 (welcome mail). Their records
  stay as history.
- ADR-0019 to ADR-0021 still describe the catalog page, minus favorites.
- A Blueprint's identity is its slug: its directory, its page, its feed item and
  its pull name.
- Static hosts serve `faq.html` at `/faq`, so the site emits pages that way and
  keeps the slashless URLs every link and the sitemap use.
