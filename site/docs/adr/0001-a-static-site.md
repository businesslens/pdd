# ADR-0001: A static site in the pdd-kit repository

Status: accepted, 2026-10-12.

read_when: adding anything that would need a server, a database, an account, or
a request-time decision; or wondering why the site lives in this repository.

## Decision

- **No server.** `nuxt generate` writes every page, feed and data file at build
  time. Nothing on the site runs per request.
- **No accounts.** No sign-in, favorites, settings, administration or mailing
  list, and nothing behind them: no auth provider, database, mail provider or
  API.
- **Blueprints come from the repository.** Each `blueprints/<slug>/` is built
  with the same release script that publishes the `blueprints-v<major>` GitHub
  Release `pdd-kit blueprint pull` reads, so the site and the CLI show the same
  Blueprints. Merging a contribution publishes it; there is no catalog server,
  listing flag or withdrawal.
- **Docs, FAQ and changelog are read from the checkout**, not fetched, so a
  change and the page that shows it land in one pull request.
- **No analytics.** The site loads no tracker and sets no tracking cookie, so
  it needs no consent notice. The report viewer keeps display choices in the
  browser, which identify no one.
- **Hosting.** Cloudflare Pages serves the output, deployed from GitHub Actions
  after the checks pass, with a preview URL per pull request. Response headers
  live in `public/_headers`.
- **No domain email.** The contact address is the maintainer's own.

## Why

A format whose home is a signed-in catalog reads as a vendor; a format with an
open repository and a static site reads as a standard. One maintainer also
cannot keep a database, auth provider, mail provider and server healthy
alongside the format itself.

## Consequences

- A Blueprint's identity is its slug: its directory, its page, its feed item and
  its pull name.
- Static hosts serve `faq.html` at `/faq`, so the site emits pages that way and
  keeps the slashless URLs every link and the sitemap use.
- Anything that needs a request-time decision does not belong on this site.
