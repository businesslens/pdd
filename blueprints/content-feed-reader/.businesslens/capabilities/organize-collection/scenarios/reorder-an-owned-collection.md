---
kind: primary
routes:
  web: Web
steps:
  - text: The Reader moves an item to a different position in an owned collection.
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
  - text: The item is moved to the chosen position
    kind: product
    actor: reader
    entities:
      - { entity: collection }
      - { entity: item, effect: reads }
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
  - text: Every other item keeps its relative order
    kind: condition
    entities:
      - { entity: item, effect: reads }
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
---

# Reorder an owned collection

## Trigger

The Reader moves an item to a different position in an owned collection.

## Outcome

The owned collection exposes the Reader's intended item order.
