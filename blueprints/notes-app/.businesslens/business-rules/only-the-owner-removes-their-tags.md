---
appliesTo:
  - { type: entity, id: tag, effect: removes }
permits:
  - related: [{ verb: keeps, entity: owner }]
---

# Only the owner removes their tags

A tag ends only when the Owner who keeps it takes it off the last note carrying
it.

## Rationale

A tag disappears from search and tagging only because of the Owner's own change.
