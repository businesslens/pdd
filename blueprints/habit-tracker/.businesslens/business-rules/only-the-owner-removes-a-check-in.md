---
appliesTo:
  - type: entity
    id: check-in
    effect: removes
permits:
  - related: [{ verb: records, entity: habit }, { verb: owns, entity: owner }]
---

# Only the Owner removes a check-in

A check-in is removed only when the Owner of its habit unchecks that day, or
deletes the habit with its history.

## Rationale

A streak is the Owner's own record; only the Owner can correct it.
