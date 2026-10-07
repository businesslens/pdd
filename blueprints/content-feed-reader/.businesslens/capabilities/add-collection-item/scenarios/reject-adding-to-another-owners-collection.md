---
kind: validation
routes:
  web: Web
steps:
  - text: The Reader attempts to add an item to a collection owned by someone else
    kind: actor
    actor: reader
    entities:
      - { entity: item, effect: reads, facts: [] }
      - { entity: collection, effect: reads, facts: [] }
    contexts:
      web:
        place: reader-web::personal-library::collection-detail
  - text: The Product checks collection ownership
    kind: product
    actor: reader
    entities:
      - { entity: collection, effect: reads, facts: [] }
    contexts:
      web:
        place: reader-web::personal-library::collection-detail
  - text: Adding is refused
    kind: condition
    entities: []
    contexts:
      web:
        place: reader-web::personal-library::collection-detail
---

# Reject adding to another owner's collection

## Trigger

The Reader attempts to add an item to a collection owned by someone else

## Outcome

The collection is unchanged and the Reader gains no editing authority.
