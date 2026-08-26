# Product model

The `.businesslens/` directory a repository keeps: the durable statement of what
its product is intended to do. Its declared coverage is the state a reader
observes — how much of the intended product breadth this model claims to hold —
and it is the first thing every BusinessLens workflow establishes before acting.

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

## Transitions

- Absent → Draft
- Absent → Partial
- Absent → Complete
- Draft → Partial
- Draft → Complete
- Partial → Complete
- Complete → Partial
