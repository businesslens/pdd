---
kind: primary
routes:
  web: Web
steps:
  - text: The Reader opens an owned collection
    kind: actor
    actor: reader
    entities:
      - { entity: collection, effect: reads, facts: [Name] }
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
  - text: The Reader moves an item to a different position in the open collection
    kind: actor
    actor: reader
    entities:
      - { entity: item, effect: reads }
      - { entity: collection, effect: reads }
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace::items
  - text: The Product confirms collection ownership
    kind: product
    actor: reader
    entities:
      - { entity: collection, effect: reads }
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace::items
  - text: The item is moved to the chosen position
    kind: product
    actor: reader
    entities:
      - { entity: collection, facts: [Item order] }
      - { entity: item, effect: reads }
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace::items
  - text: Every other item keeps its relative order
    kind: condition
    entities:
      - { entity: item, effect: reads }
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace::items
---

# Reorder an owned collection

## Trigger

The Reader moves an item to a different position in an owned collection.

## Outcome

The owned collection exposes the Reader's intended item order.
