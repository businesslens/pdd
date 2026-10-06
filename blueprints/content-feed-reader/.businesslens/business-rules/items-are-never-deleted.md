---
appliesTo:
  - type: entity
    id: item
    effect: removes
permits: []
---

# Items are never deleted

Once an item is in a Reader's library it stays there. Unfollowing its source,
removing it from the saved items, and deleting a collection that held it all
leave the item in place.

## Rationale

A library is durable reading history. Losing an item because a feed went away
or a reading list was tidied would make the library undependable.
