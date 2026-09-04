---
kind: primary
routes:
  web: Web
steps:
  - text: The Reader removes an item from an owned collection.
    kind: actor
    actor: reader
    entities:
      - { entity: item, effect: reads }
      - { entity: collection, effect: reads }
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
  - text: The Product confirms collection ownership
    kind: product
    actor: reader
    entities:
      - { entity: collection, effect: reads }
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
  - text: The item is removed from that collection
    kind: product
    actor: reader
    entities:
      - { entity: collection }
      - { entity: item, effect: reads }
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
  - text: The remaining item order and the item's saved state are preserved
    kind: condition
    entities:
      - { entity: item, effect: reads }
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
---

# Remove an item from an owned collection

## Trigger

The Reader removes an item from an owned collection.

## Outcome

The item no longer belongs to the collection and remains saved independently.
