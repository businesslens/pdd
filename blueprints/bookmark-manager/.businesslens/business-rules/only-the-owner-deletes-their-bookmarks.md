---
appliesTo:
  - { type: entity, id: bookmark, effect: removes }
permits:
  - related: [{ verb: owns, entity: owner }]
---

# Only the Owner deletes their bookmarks

A bookmark leaves the library only by its Owner's own action: deleting it, or
accepting a duplicate suggestion that merges it into another. Their AI agent
never deletes one.

## Rationale

A deleted bookmark is gone for good, so only the person who kept it decides it
should go.
