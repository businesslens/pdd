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
      - { entity: collection, effect: creates, to: Private, facts: [Name, Item order] }
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
  - text: The Product opens the new, empty collection for the Reader to work in
    kind: product
    actor: reader
    entities:
      - { entity: collection, effect: reads, facts: [Name] }
    contexts:
      web:
        place: reader-web::personal-library::collection-detail
---

# Create an owned collection

## Trigger

The Reader chooses to gather saved items in a new collection.

## Outcome

The Reader has a new private owned collection with the chosen name, open in
front of them and ready for its first item.
