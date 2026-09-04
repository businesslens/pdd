---
kind: primary
routes:
  web: Web
steps:
  - text: The Reader provides a name
    kind: actor
    actor: reader
    entities: []
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
  - text: The Product creates a private collection owned by that Reader
    kind: product
    actor: reader
    entities:
      - { entity: collection, effect: creates, to: Private }
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
  - text: The empty collection is ready to edit
    kind: condition
    actor: reader
    entities:
      - { entity: collection, effect: reads }
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
---

# Create an owned collection

## Trigger

The Reader chooses to organize saved items in a new collection.

## Outcome

The Reader has a new private owned collection with the chosen name.
