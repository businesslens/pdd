---
kind: primary
routes:
  web: Web
steps:
  - text: The Reader moves an item to a different position in an owned collection.
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
  - text: The item is moved to the chosen position
    kind: product
    changes:
      - entity: collection
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
  - text: Every other item keeps its relative order
    kind: condition
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
---

# Reorder an owned collection

## Trigger

The Reader moves an item to a different position in an owned collection.

## Outcome

The owned collection exposes the Reader's intended item order.
