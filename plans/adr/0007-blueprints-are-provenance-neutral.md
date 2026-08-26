# 0007 — Blueprints are provenance-neutral by design

Status: **Accepted** — 2026-08-26

## Context

The model review proposed adding a `derivedFrom: implementation | intent |
mixed` field to the Product Report, surviving the portable projection, so a
catalog reader could tell a Blueprint mapped from a working product from one
authored as intent. The reasoning was that a marketplace of "systems users can
achieve building" leaves the reader unable to judge which Blueprints anyone has
built.

That proposal was **rejected**, and the rejection is a design decision worth
recording rather than a preference.

## Decision

**A Blueprint carries no claim about its own origin.** It is a product design,
offered on its own terms. It does not assert that an implementation exists, that
one ever existed, or that anybody verified it.

Neutrality is the product decision. A Blueprint that advertised provenance would
become a ranking signal — "battle-tested" versus "merely designed" — and the
catalog would start sorting on a property that says nothing about whether the
design is good. A design mapped from a mediocre shipped product is not better
than a well-reasoned one that has never been built.

## Consequences

- No provenance field is added to the Product Report, now or later. A future
  proposal to add one must supersede this ADR rather than extend it.
- The portable projection continues to strip every `kind: code` reference and
  every repository-relative target, and this is not a lossy compromise — it is
  the point.
- Coverage `method` describes how a model was derived, which is a provenance
  claim. Expansion may overwrite it. Coverage `unmapped`, `limitations`, and
  `rationale` describe the *model's own completeness* rather than its origin;
  they carry no provenance and must survive expansion intact (F7).
- `spec/report.md` must stop listing `method` among the author prose that is
  "never rewritten", because under this decision rewriting it is correct.
