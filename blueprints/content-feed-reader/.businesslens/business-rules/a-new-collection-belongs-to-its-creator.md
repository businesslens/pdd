---
appliesTo:
  - type: entity
    id: collection
    effect: creates
permits:
  - related: [{ verb: owns, entity: reader }]
---

# A new collection belongs to its creator

A Reader creates collections only in their own library, and each one belongs to
the Reader who created it from the start.

## Rationale

Ownership decides who may change, publish and delete a collection, so it is
settled at the moment the collection exists.
