---
transitions:
  - from: Absent
    to: Draft
    by: map-established-behavior
  - from: Absent
    to: Partial
    by: map-established-behavior
  - from: Absent
    to: Complete
    by: decide-intended-behavior
  - from: Draft
    to: Partial
    by: map-established-behavior
  - from: Draft
    to: Complete
    by: map-established-behavior
  - from: Partial
    to: Complete
    by: map-established-behavior
  - from: Complete
    to: Partial
    by: decide-intended-behavior
---

# Product model

The `.businesslens/` directory a repository keeps: the durable statement of what
its product is intended to do. Its declared coverage is the state a reader
observes — how much of the intended product breadth this model claims to hold —
and it is the first thing every BusinessLens workflow establishes before acting.

## Information kept

- Which Product it describes, and that Product's identity and attribution
- Every Element it holds, and the relationships between them
- How much of the intended Product breadth it claims to cover
- The inspection that produced it, and what it leaves unmapped

## States

### Absent

The repository has no `.businesslens/` directory here or at its root. Structural
checking and local reading refuse; mapping, deciding, and expanding a Blueprint
are the ways in.

### Draft

The model exists, and its own author is still reviewing it. Gaps in Capability
Scenario coverage are reported as warnings rather than failures.

### Partial

The model is useful and known product areas are still unmapped. It names those
areas explicitly rather than implying they do not exist.

### Complete

The intended product breadth is modeled. Structural checking now demands at
least one Capability and direct Scenario coverage for every availability
Context, and a public Blueprint demands the same.
