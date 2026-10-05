---
kind: primary
routes:
  web: Web
steps:
  - text: The Product confirms collection ownership
    kind: product
    actor: reader
    entities:
      - { entity: collection, effect: reads, facts: [] }
    contexts:
      web:
        place: reader-web::personal-library::collection-detail
  - text: The Reader provides the replacement name
    kind: actor
    actor: reader
    entities: []
    contexts:
      web:
        place: reader-web::personal-library::collection-detail
  - text: The Product preserves the collection's items and order under the new name
    kind: product
    actor: reader
    entities:
      - { entity: collection, facts: [Name] }
      - { entity: item, effect: reads, facts: [] }
    contexts:
      web:
        place: reader-web::personal-library::collection-detail
---

# Rename an owned collection

## Trigger

The Reader changes the name of an owned collection.

## Outcome

The owned collection has the new name without losing its contents or publication state.
