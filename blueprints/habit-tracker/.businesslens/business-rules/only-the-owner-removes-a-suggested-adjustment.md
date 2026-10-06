---
appliesTo:
  - type: entity
    id: suggested-adjustment
    effect: removes
permits:
  - related: [{ verb: receives, entity: habit }, { verb: owns, entity: owner }]
---

# Only the Owner removes a suggested adjustment

A suggested adjustment is removed only with its habit, when the Owner of that
habit deletes it after they confirm. Accepting or dismissing a suggestion keeps
it, reading as accepted or dismissed.

## Rationale

A suggestion is about one habit; once the Owner has let that habit go, there is
nothing left for it to change.
