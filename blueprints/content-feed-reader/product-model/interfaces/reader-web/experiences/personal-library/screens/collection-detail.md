---
entities:
  - { entity: collection, shows: [Name, Item order, Public address] }
  - { entity: item, shows: [Title, Saved at] }
entryPoints:
  - reader-web: /collections/:collectionId
---

# Collection detail

One collection the Reader owns, opened to work in. It presents the items in the
owner's order and lets the Reader add a saved item, remove one, move one to
another owned collection, or change the order. It presents the collection's
name and lets the owner give it a new name. It shows whether the collection is
private, published or unpublished and the public address it is or was served
at, and lets the owner publish it, unpublish it, or publish it again. It is
where the owner deletes the collection, after confirming.
