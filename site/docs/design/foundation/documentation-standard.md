# Documentation Standard

read_when: adding, moving, or changing design documentation, or changing a
cross-cutting product/implementation boundary.

## Purpose

The design set records the current site and clearly labels future work.
Executable routes, schemas, and UI remain the final authority when a
contradiction is found; the contradiction must then be fixed in the same change
rather than preserved as an undocumented exception.

## Sources of Truth

Documents that exist today:

- [`CONTEXT.md`](../../../CONTEXT.md) owns the internal vocabulary. The affected
  Product Model pages in the repository's `docs/` own the corresponding public
  definitions.
- [`docs/adr/`](../../adr/) owns decisions whose rationale is not recoverable
  from the code. An ADR is not superseded by a later document — it is superseded
  by a later ADR.
- [`docs/engineering-standards.md`](../../engineering-standards.md) owns the
  site's tooling, quality gates, dependency policy, and import boundaries.
- [`docs/analytics.md`](../../analytics.md) owns analytics configuration and
  consent.
- `docs/design/foundation/` owns the documentation standard and the brand.
- `docs/design/ui/` owns screens, shared visual patterns, and state coverage.
- `docs/design/architecture/` owns the build pipeline, data sources, and
  routes.
- `docs/design/experiences/` owns what each surface lets someone do, and the
  rules behind it.

The [design set map](../README.md) is the current index of these homes. Do not
create a directory until there is a document to put in it; an empty tree reads
as coverage that does not exist.

## Document Rules

- Add a short `read_when` hint to cross-cutting documents.
- Describe implemented behavior in the present tense.
- Label future work explicitly. Do not mix it into an implemented route, state,
  schema, or acceptance list.
- Use exact route, field, and enum names from source.
- Do not retain superseded wireframes or transition models inside documents
  marked implemented.
- Prefer a link to one authoritative contract over repeating a large schema.
- Use the vocabulary in `CONTEXT.md` exactly. A document that says "Hub",
  "Explore", or "Blueprint Revision" is describing a product that no longer
  exists.

## Update Matrix

| Change | Documents to review |
| --- | --- |
| Blueprint build or release format | architecture docs, the catalog experience, the CLI docs — `pull` is a consumer |
| Route or page state | routing docs, the owning UI doc, `server/routes/sitemap.xml.get.ts` |
| Analytics events or consent | [analytics](../../analytics.md), the privacy page |
| Brand tokens, typography, or shared visual pattern | brand guidelines, the owning UI doc |
| Vocabulary | `CONTEXT.md` **and** the affected Product Model pages in the repository's `docs/` |
| Decision that a future reader would want to reverse | a new ADR |

## Status Labels

Use a status only when it adds information:

```text
Status: Draft
Status: Proposed
Status: Accepted
Status: Implemented
Status: Accepted and implemented
Status: Superseded
```

An implemented label means every current-state claim is verifiable in source or
in automated coverage. Historical implementation steps may remain only when they
do not contradict the final shape.

A superseded document keeps its content and gains a pointer to what replaced it.
Delete it only when nothing in it explains a decision that still stands.

## Alignment Gate

Before handing off a cross-cutting change:

1. Search the design set for superseded names and behaviors.
2. Compare documented routes, data files, and states with source.
3. Run verification proportional to the changed behavior — see the
    [Verification](../../../AGENTS.md#verification) section of `AGENTS.md`.
4. State any intentionally deferred work separately from gaps you simply did not
    reach.
