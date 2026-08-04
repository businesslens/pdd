---
status: accepted
---

# Unified References and portable Reports

Supersedes [ADR-0003](./0003-source-free-is-a-report-profile.md) and
[ADR-0005](./0005-coderefs-are-bookmarks.md).

## Context

`codeRefs` and `links` described the same broader relationship—an entity
attached to material outside the Product Model—but used incompatible shapes.
They could not consistently distinguish a design used to curate intent from a
screenshot of current implementation, or contextual research from an
implementation artifact. Coverage then counted one Reference subtype, coupling
model breadth to optional navigation.

## Decision

Every semantic entity uses one optional strict `references` collection. `kind`
identifies the artifact (`code`, `spec`, `proposal`, `doc`, `adr`, `visual`, or
`research`); `role` identifies why it is attached (`intent`, `implementation`,
or `context`); `target` locates it; and optional `title` labels it.

References supplement a self-contained Product Model. They never replace
Product prose, prove alignment, or claim freshness. Code targets keep their
compact grammar and tracked-file requirement. Other targets use HTTP(S) or a
repository-relative path.

Product Report v7 declares `referenceProfile: workspace|portable`. The portable
projection keeps only HTTP(S) intent/context References and removes repository
entry points and Coverage source areas. Blueprint export, open, pull, and
contribute use this shared projection.

Coverage describes only mapping breadth. It has no counts, mapped fields,
redaction flag, or other Reference-derived state. Entity totals live in the
Report Summary.

## Consequences

- A screenshot's role distinguishes curated intent, implementation capture, and
  context without embedding the file in the model.
- Code can be attached with any honest role while remaining navigation rather
  than proof.
- All semantic entities share one repeatable extension and strict validation.
- Portable reports are explicitly identifiable and validation rejects leaked
  workspace material.
- A complete model may contain no References, and Reference edits do not alter
  Coverage.
