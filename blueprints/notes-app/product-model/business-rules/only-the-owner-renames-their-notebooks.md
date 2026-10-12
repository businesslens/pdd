---
appliesTo:
  - { type: entity, id: notebook, effect: changes }
permits:
  - related: [{ verb: keeps, entity: owner }]
---

# Only the owner renames their notebooks

A notebook's name is changed only by the Owner who keeps it.

## Rationale

The Owner files by a notebook's name, so it changes only when they decide.
