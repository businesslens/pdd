---
kind: primary
routes:
  web: Web
steps:
  - text: The Reader removes an item from an owned collection.
    kind: actor
    actor: reader
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
  - text: The Product confirms collection ownership
    kind: product
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
  - text: The item is removed from that collection
    kind: product
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
  - text: The remaining item order and the item's saved state are preserved
    kind: condition
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
---

# Remove an item from an owned collection

## Trigger

The Reader removes an item from an owned collection.

## Outcome

The item no longer belongs to the collection and remains saved independently.
