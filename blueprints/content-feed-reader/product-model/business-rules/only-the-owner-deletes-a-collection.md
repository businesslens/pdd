---
appliesTo:
  - type: entity
    id: collection
    effect: removes
permits:
  - related: [{ verb: owns, entity: reader }]
---

# Only the owner deletes a collection

A collection is deleted only by the Reader who owns it, and only after they
confirm. Deleting it never touches the items it held.

## Rationale

Deleting is for good, so it is the one change to a collection that only its
owner's deliberate decision may make.
