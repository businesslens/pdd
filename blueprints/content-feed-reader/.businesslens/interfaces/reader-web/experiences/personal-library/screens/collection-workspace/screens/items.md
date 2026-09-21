---
entities:
  - { entity: collection, facts: [Name, Item order] }
  - { entity: item, facts: [Title, Saved at] }
capabilities:
  - organize-collection
entryPoints:
  - reader-web: /collections/:collectionId
---

# Items

Presents the items of the open collection in the owner's order, and lets the
Reader add a saved item, remove one, move one to another owned collection, or
change the order.
