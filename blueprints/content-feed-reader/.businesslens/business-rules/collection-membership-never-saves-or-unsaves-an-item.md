---
appliesTo:
  - type: entity
    id: item
    effect: changes
    facts: [Saved at]
---

# Collection membership never saves or unsaves an item

Adding an item to a collection, moving it, removing it, or deleting the
collection never saves or unsaves that item. Only saving it or removing it from
the saved items does.

## Rationale

Keeping an item and gathering it into a reading list are separate Reader
decisions; changing one must not silently reverse the other.
