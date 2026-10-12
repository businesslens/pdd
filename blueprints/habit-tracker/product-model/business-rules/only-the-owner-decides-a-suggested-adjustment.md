---
appliesTo:
  - type: entity
    id: suggested-adjustment
    effect: changes
permits:
  - related: [{ verb: receives, entity: habit }, { verb: owns, entity: owner }]
---

# Only the Owner decides a suggested adjustment

A suggested adjustment is accepted or dismissed only by the Owner of the habit
it concerns, and only by an explicit choice. It is never accepted by default
or by silence, and it stays waiting until the Owner answers it or it no longer
fits the habit.

## Rationale

Accepting is the one step that turns a suggestion into a schedule change, so it
must always be a decision the Owner made.
