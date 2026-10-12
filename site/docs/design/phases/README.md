# Delivery Phases

read_when: checking implementation status or sequencing new work.

Status of the work, in the order it happened. This page is the index, and it is
the fastest way to answer "does that exist yet?". Earlier phases are history:
Phase E removed most of what B and D built.

## Phase A — The public site

Status: Implemented.

Marketing, documentation, blog, and changelog at `pdd-kit.dev`, extracted
from the `platform` repository into its own Nuxt application.

## Phase B — The Blueprint catalog

Status: Implemented, 2026-07-30; superseded by Phase E.

`/blueprints` and `/blueprints/:slug`, anonymous pull, and contribution by pull
request. This phase served the catalog from its own server with accounts and
curation; Phase E replaced that with Blueprints built from the repository.

## Phase C — Design documentation

Status: Implemented.

The design documentation system ported from the `platform` repository and
repopulated for this product: `architecture/`, `experiences/`, `foundation/`,
`product/`, `plans/`, and `ui/`. Its generated screen gallery was removed in
Phase E.

## Phase D — Product-update email

Status: Implemented in code, 2026-08-09; never rolled out; removed in Phase E.

## Phase E — A static site in the pdd-kit repository

Status: Implemented, 2026-10-12.

BusinessLens became pdd-kit. The site moved into `site/` of
`itai-gendler/pdd-kit` and is generated as static files, with docs, FAQ,
changelog, and Blueprints read from the same checkout. See
[ADR-0022](../../adr/0022-a-static-site-in-the-pdd-kit-repository.md).

## Adding a phase

A phase is a delivery milestone with a gate, not a sprint. Add one when a body of
work has an acceptance condition someone could check. The gate for every phase
here is the same:

```bash
pnpm editorconfig && pnpm lint && pnpm typecheck && pnpm knip \
  && pnpm test:integration && pnpm generate && pnpm test:e2e
```
