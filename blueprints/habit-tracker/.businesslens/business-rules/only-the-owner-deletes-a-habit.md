---
appliesTo:
  - type: entity
    id: habit
    effect: removes
permits:
  - related: [{ verb: owns, entity: owner }]
---

# Only the Owner deletes a habit

A habit is deleted only by its Owner, after they confirm, and the deletion is
for good. The Product never deletes one on its own, however long it has gone
unchecked.

## Rationale

Deleting loses the habit's whole history, so it must always be the Owner's
deliberate choice.
