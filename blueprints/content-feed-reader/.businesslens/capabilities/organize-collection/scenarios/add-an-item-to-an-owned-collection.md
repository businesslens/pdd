---
kind: primary
routes:
  web: Web
steps:
  - text: The Reader chooses a saved item and an owned collection.
    kind: actor
    reads:
      - item
      - collection
    actor: reader
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
  - text: The Product confirms collection ownership
    kind: product
    reads:
      - collection
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
  - text: The item is added at the chosen position
    kind: product
    changes:
      - entity: collection
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
  - text: The remaining order is preserved
    kind: condition
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
---

# Add an item to an owned collection

## Trigger

The Reader chooses a saved item and an owned collection.

## Outcome

The owned collection contains the item in the intended order.
