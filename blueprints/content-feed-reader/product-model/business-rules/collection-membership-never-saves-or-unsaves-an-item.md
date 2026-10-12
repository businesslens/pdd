---
appliesTo:
  - type: capability
    id: add-collection-item
  - type: capability
    id: remove-collection-item
  - type: capability
    id: move-collection-item
  - type: capability
    id: delete-collection
  - type: journey
    id: start-a-collection
---

# Collection membership never saves or unsaves an item

Adding an item to a collection, moving it, removing it, or deleting the
collection never saves or unsaves that item. Only saving it or removing it from
the saved items does.

## Rationale

Keeping an item and gathering it into a reading list are separate Reader
decisions; changing one must not silently reverse the other.
