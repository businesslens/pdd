---
status: superseded by ADR-0008
---

# Code references are bookmarks, not proof

> **Superseded by [ADR-0008](./0008-unified-references-and-portable-reports.md).**
> Code navigation keeps this non-proof meaning as `kind: code` within the
> universal References model.

## Context

`codeRefs` were carrying four incompatible meanings: navigation, proof,
implementation state, and CI completion. The CLI only checked their grammar and
whether a path was tracked; it never checked the symbol, line, behavior, or
semantic agreement. Calling that evidence made a structurally green model sound
more certain than it was.

`coverage.status: draft` then acted as a global exception for missing refs even
though mature repositories routinely contain a mixture of existing and planned
behavior. Git branch-state inference added a third, conflicting lifecycle model.

## Decision

`codeRefs` are optional navigational bookmarks. Missing refs are valid for every
entity and every coverage status. Present refs retain their deterministic grammar
and must point at tracked repository paths so bookmarks cannot silently rot.

`coverage.status` describes only how broadly the Product Model itself has been
authored: `draft`, `partial`, or `complete`. It does not describe implementation
or verification. A complete model may have no codeRefs.

`businesslens lint` checks this structure. `businesslens-verify` performs the
semantic comparison with code. Neither a codeRef nor a green lint result is a
verification receipt.

The serialized shapes remain compatible, so this relaxation does not require a
folder-schema bump. `coverage.mapped` and `coverage.evidenceRedacted` remain in
Product Report v4 for wire compatibility. Mapped counts mean only “entities that
had implementation-linked bookmarks before redaction.”

## Consequences

- Plans and Blueprints no longer need invented evidence or a lifecycle mode.
- Refactors can refresh useful bookmarks without pretending product meaning
  changed.
- CI can enforce structure with `lint`, but semantic verification remains an
  agent workflow rather than a misleading parser guarantee.
- Documentation must never say a green lint result proves model/code agreement.
