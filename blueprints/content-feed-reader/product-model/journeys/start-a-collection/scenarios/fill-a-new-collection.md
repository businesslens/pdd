---
kind: primary
result: achieved
steps:
  - text: The Reader provides a name
    kind: actor
    actor: reader
    capability: create-collection
    entities: []
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
  - text: The Product creates the private collection and opens it for the Reader to work in
    kind: product
    actor: reader
    capability: create-collection
    entities:
      - { entity: collection, effect: creates, to: Private, facts: [ Name, Item order ] }
    contexts:
      web:
        place: reader-web::personal-library::collection-detail
  - text: The Reader adds a saved item to the new collection
    kind: actor
    actor: reader
    capability: add-collection-item
    entities:
      - { entity: collection, facts: [ Item order ] }
      - { entity: item, effect: reads, facts: [] }
    contexts:
      web:
        place: reader-web::personal-library::collection-detail
routes:
  web: Web
---

# Fill a new collection

## Trigger

The Reader has saved items that belong together in a reading list they do not
have yet.

## Outcome

The Journey goal is achieved: the new collection exists under its chosen name
and holds the saved item, which stays saved independently of it.
