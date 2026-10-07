---
entities:
  - { entity: collection, shows: [Name, Item order] }
  - { entity: item, shows: [Title, Published at] }
entryPoints:
  - reader-web: /collections/:collectionSlug
---

# Public collection

Presents one published collection — its name, its owner, and the items in the
owner's order — to anyone holding its web address, and nothing once the owner
has unpublished or deleted it.
