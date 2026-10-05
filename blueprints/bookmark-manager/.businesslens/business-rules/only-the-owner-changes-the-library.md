---
appliesTo:
  - { type: entity, id: bookmark, effect: creates }
  - { type: entity, id: bookmark, effect: changes }
  - { type: entity, id: bookmark, effect: removes }
  - { type: entity, id: collection, effect: creates }
  - { type: entity, id: collection, effect: changes }
  - { type: entity, id: collection, effect: removes }
  - { type: entity, id: tag, effect: creates }
  - { type: entity, id: tag, effect: removes }
permits:
  - actors: [owner]
---

# Only the Owner changes the library

Bookmarks, collections and tags are added, changed and removed only by the
Owner's own action: saving, editing, deleting, importing, or accepting or
merging a suggestion. The assistant reads the library and prepares
suggestions; it never files, tags, merges or deletes anything itself.

## Rationale

The library is one person's memory of what they found worth keeping. An
assistant that could rearrange it on its own would make the Owner unsure where
anything is, so every change it proposes waits for the Owner.
