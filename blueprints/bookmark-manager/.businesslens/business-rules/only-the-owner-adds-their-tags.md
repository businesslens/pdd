---
appliesTo:
  - { type: entity, id: tag, effect: creates }
permits:
  - related: [{ verb: carries, entity: bookmark }, { verb: owns, entity: owner }]
---

# Only the Owner adds their tags

A tag enters the library only through its Owner's own changes to a bookmark:
saving, editing, or accepting a suggestion. Their AI agent can propose a tag
but never adds one.

## Rationale

Tags are the Owner's own words for what they keep.
