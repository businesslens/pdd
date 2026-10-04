---
kind: validation
routes:
  web: Web
steps:
  - text: The Reader attempts to change a collection owned by someone else.
    kind: actor
    actor: reader
    entities:
      - { entity: collection, effect: reads, facts: [] }
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace::items
  - text: The Product checks collection ownership
    kind: product
    actor: reader
    entities:
      - { entity: collection, effect: reads, facts: [] }
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace::items
  - text: The attempted membership change is rejected
    kind: condition
    entities: []
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace::items
---

# Reject adding to another owner's collection

## Trigger

The Reader attempts to change a collection owned by someone else.

## Outcome

The collection is unchanged and the Reader gains no editing authority.
