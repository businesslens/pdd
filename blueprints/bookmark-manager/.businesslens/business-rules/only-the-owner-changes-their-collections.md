---
appliesTo:
  - { type: entity, id: collection, effect: changes }
permits:
  - related: [{ verb: owns, entity: owner }]
---

# Only the Owner changes their collections

A collection is renamed only by its Owner.

## Rationale

The Owner finds a collection by its name; it changes only when they change it.
