---
kind: edge
routes:
  web: Web
steps:
  - text: A Visitor opens a public address after its owner has unlisted the collection.
    kind: actor
    actor: visitor
    entities:
      - { entity: collection, effect: reads }
    contexts:
      web:
        place: reader-web::public-reading::public-collection
  - text: The Product determines that the collection is no longer public
    kind: product
    actor: visitor
    entities:
      - { entity: collection, effect: reads }
    contexts:
      web:
        place: reader-web::public-reading::public-collection
  - text: Collection contents are withheld
    kind: product
    actor: visitor
    entities:
      - { entity: collection, effect: reads }
    contexts:
      web:
        place: reader-web::public-reading::public-collection
  - text: A neutral unavailable state is shown
    kind: product
    entities: []
    contexts:
      web:
        place: reader-web::public-reading::public-collection
---

# Open an unlisted collection

## Trigger

A Visitor opens a public address after its owner has unlisted the collection.

## Outcome

The Visitor sees that the collection is unavailable without learning anything from the owner's private library.
