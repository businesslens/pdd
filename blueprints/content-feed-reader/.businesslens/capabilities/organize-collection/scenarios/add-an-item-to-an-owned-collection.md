---
kind: primary
routes:
  web: Web
steps:
  - text: The Reader chooses a saved item and an owned collection.
    kind: actor
    actor: reader
    entities:
      - { entity: item, effect: reads, facts: [] }
      - { entity: collection, effect: reads, facts: [Name] }
    contexts:
      web:
        place: reader-web::personal-library::collection-detail
  - text: The Product confirms collection ownership
    kind: product
    actor: reader
    entities:
      - { entity: collection, effect: reads, facts: [] }
    contexts:
      web:
        place: reader-web::personal-library::collection-detail
  - text: The item is added at the chosen position
    kind: product
    actor: reader
    entities:
      - { entity: collection, facts: [Item order] }
      - { entity: item, effect: reads, facts: [] }
    contexts:
      web:
        place: reader-web::personal-library::collection-detail
  - text: The remaining order is preserved
    kind: condition
    entities: []
    contexts:
      web:
        place: reader-web::personal-library::collection-detail
---

# Add an item to an owned collection

## Trigger

The Reader chooses a saved item and an owned collection.

## Outcome

The owned collection contains the item in the intended order.
