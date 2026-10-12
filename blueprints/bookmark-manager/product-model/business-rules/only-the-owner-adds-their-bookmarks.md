---
appliesTo:
  - { type: entity, id: bookmark, effect: creates }
permits:
  - related: [{ verb: owns, entity: owner }]
---

# Only the Owner adds their bookmarks

A bookmark enters a library only by its Owner's own action: saving a link or
importing a browser's bookmarks. Their AI agent never adds one.

## Rationale

What enters the library is what the Owner chose to keep, and nothing else.
