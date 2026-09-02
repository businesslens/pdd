---
appliesTo:
  - type: entity
    id: collection
    effect: changes
permits:
  - related: [{ verb: owns, entity: reader }]
---

# Only an owner changes a collection

Only the Reader who created a collection can change its contents, order, name,
or publication state.

## Rationale

A public link grants read access, never collaboration or ownership.
