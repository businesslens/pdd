---
appliesTo:
  - type: entity
    id: suggested-adjustment
    effect: changes
    to: Accepted
permits:
  - related: [{ verb: receives, entity: habit }, { verb: owns, entity: owner }]
---

# Only the Owner accepts a suggested adjustment

A suggested adjustment is accepted only by the Owner of the habit it concerns,
and only by an explicit choice. It is never accepted by default, by silence, or
when it expires.

## Rationale

Accepting is the one step that turns a suggestion into a schedule change, so it
must always be a decision the Owner made.
