---
kind: primary
routes:
  web: Web
steps:
  - text: The Product loads the collection name, owner display name, and ordered items
    kind: product
    actor: visitor
    entities:
      - { entity: collection, effect: reads }
      - { entity: item, effect: reads }
    contexts:
      web:
        place: reader-web::public-reading::public-collection
  - text: The Visitor opens and reads an item
    kind: actor
    actor: visitor
    entities:
      - { entity: item, effect: reads }
    contexts:
      web:
        place: reader-web::public-reading::public-collection
  - text: No private reading state is created
    kind: condition
    entities: []
    contexts:
      web:
        place: reader-web::public-reading::public-collection
---

# Read a published collection

## Trigger

A Visitor opens the public address of a published collection.

## Outcome

The Visitor can read the published collection without gaining access to the owner's private library.
