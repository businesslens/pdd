---
status: accepted
---

# Three public skills and one verification loop

## Context

Six public skills overlapped by scale and recovery state. `init`, `sync`, and
`deep-dive` all mapped code into the model; `doctor` diagnosed conditions the
other workflows should handle; `contribute` duplicated a deterministic CLI
command. Users had to understand internal routing before they could choose a
door.

The most common post-build case was also split conceptually: verification could
find a gap but offered no single flow for negotiating authority, updating the
model when intended meaning changed, invoking the user's builder when code was
wrong, and checking again.

## Decision

Expose exactly three self-contained skills:

| Skill | Job |
| --- | --- |
| `businesslens-map` | Create or expand a model from established repository behavior. |
| `businesslens-ideate` | Decide intended product behavior and write only an approved model delta. |
| `businesslens-verify` | Compare a requested scope and automatically orchestrate resolution until aligned or blocked. |

`verify` includes narrow internal protocols for scoped mapping and intent
resolution because installed skills may not depend on siblings. When the harness
supports child agents it may delegate those phases; otherwise it performs them
as internal phase transitions in the same invocation.

Implementation remains external. Verify can hand an acceptance packet to a
builder injected by the user's harness, operating under separate normal
repository permissions. BusinessLens analysis phases never execute target code.
If no builder is available, verify stops with the complete handoff packet.

`init`, `sync`, `doctor`, `deep-dive`, and the `contribute` skill are retired.
Catalog contribution remains `businesslens blueprint contribute`.

## Consequences

- `map` is an adoption and coverage-expansion tool, not a daily command.
- `verify` handles branch-scoped changes and present-state audits without using
  Git to choose truth.
- Users invoke verify once; they do not manually chain child skills.
- User approval remains required for changed product meaning and authorization
  remains required for implementation changes.
- `/businesslens-verify report only` disables writes and delegation.
