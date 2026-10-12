# Product Requirements

read_when: deciding whether something belongs in this product at all.

This is the standing description of what `pdd-kit.dev` is for. Why the site is
static and lives in the pdd-kit repository is in
[ADR-0022](../../adr/0022-a-static-site-in-the-pdd-kit-repository.md).

## The problem

A coding agent handed a prompt and a codebase still has to guess what the product
is supposed to do. So does a new engineer, and so does the product manager who
wrote the prompt. Everyone reconstructs the same actors, journeys, rules, and
decisions from scattered fragments — tickets, comments, tribal memory — and
everyone reconstructs them slightly differently.

## The product

One site, four things:

1. **An open format** for describing what a product does — the Product Model,
    documented in `itai-gendler/pdd-kit` and rendered at `/docs`.
2. **A CLI and skills** that author a model, export it, and build software from
    it.
3. **A public catalog** of curated Blueprints at `/blueprints`, browsable by
    anyone.
4. **Anonymous one-command pull**, so a Blueprint becomes a local
    `product-model/` and an agent can start from it.

Contribution is by pull request against `itai-gendler/pdd-kit`, opened with
`pdd-kit blueprint contribute`. Curation is the maintainer merging it.

## Requirements that constrain everything else

These are the ones that have already been paid for, and that a future change must
not quietly reverse:

- **Pulling is anonymous.** No account, no credential, no token. Anything that
  puts identity in front of a pull breaks the product's entry path.
- **Nothing runs per request.** Every page, feed, and data file is generated at
  build time, so the site needs no server, database, or secret to serve.
- **The site and the CLI show the same Blueprints.** Both are built from the
  repository's `blueprints/` by one release script.
- **Every visitor gets the same page.** There are no accounts and no per-viewer
  content.
- **Workspace material never reaches the catalog.** The portable projection
  removes implementation References, code References, repository-relative
  targets, and source areas before publication.
- **Public and internal terminology must agree.** The owning Product Model
  pages in the repository's `docs/` and [`CONTEXT.md`](../../../CONTEXT.md) use one vocabulary.

## Explicitly not in this product

Naming these is cheaper than re-litigating them:

- **Pricing, billing, plans.** Monetization is paused; `/pricing` was removed
  rather than shipping an offering with an empty cart.
- **Accounts, workspaces, teams, invitations, API keys.** There is nothing to
  sign up for; contributors use their GitHub account.
- **Projects, Tracks, Versions, Blueprint Revisions.** A Blueprint is a
  directory, and merging a change to it replaces it. The lifecycle these implied
  belonged to the retired Platform.
- **A private Platform application.** It is not part of this product.
- **Processes, KPIs, dashboards.** Removed with the port and not coming back.
- **A server, a database, or email.** Removed by
  [ADR-0022](../../adr/0022-a-static-site-in-the-pdd-kit-repository.md); anything
  that needs a request-time decision does not belong on this site.

## How a proposal gets judged

1. Does it serve every visitor the same way? There are no accounts to tailor it.
2. Can it be generated at build time from the repository?
3. Does it add a noun? If so, it needs a `CONTEXT.md` entry and a reason the
    existing nouns do not cover it.
4. Does it reintroduce something in the list above? Then it needs an ADR arguing
    against the decision that removed it, not a pull request that quietly restores
    it.

## Related

- [System architecture](../architecture/system-architecture.md)
- [Catalog](../experiences/catalog.md)
- [`docs/adr/`](../../adr/) — the decisions a future reader would otherwise "fix"
