---
appliesTo:
  - { type: entity, id: collection, effect: removes }
permits:
  - related: [{ verb: owns, entity: owner }]
---

# Only the Owner deletes their collections

A collection is deleted only by its Owner, once the Owner confirms.

## Rationale

Deleting a collection undoes the Owner's own filing, so only the Owner decides
it.
