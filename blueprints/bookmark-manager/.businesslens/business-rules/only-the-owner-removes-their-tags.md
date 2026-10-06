---
appliesTo:
  - { type: entity, id: tag, effect: removes }
permits:
  - related: [{ verb: carries, entity: bookmark }, { verb: owns, entity: owner }]
---

# Only the Owner removes their tags

A tag leaves the library only when its Owner's own change takes it off its last
bookmark, by editing or deleting that bookmark. Their AI agent never removes
one.

## Rationale

Tags are the Owner's own words for what they keep, so they go only when the
Owner stops using them.
