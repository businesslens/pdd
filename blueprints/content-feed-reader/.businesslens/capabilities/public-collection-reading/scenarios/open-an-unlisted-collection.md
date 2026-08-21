---
kind: edge
routes:
  web: Web
steps:
  - text: A Visitor opens a public address after its owner has unlisted the collection.
    kind: actor
    actor: visitor
    places:
      web: reader-web::public-reading::public-collection
  - text: The Product determines that the collection is no longer public
    kind: product
    places:
      web: reader-web::public-reading::public-collection
  - text: Collection contents are withheld
    kind: product
    places:
      web: reader-web::public-reading::public-collection
  - text: A neutral unavailable state is shown
    kind: product
    places:
      web: reader-web::public-reading::public-collection
---

# Open an unlisted collection

## Trigger

A Visitor opens a public address after its owner has unlisted the collection.

## Outcome

The Visitor sees that the collection is unavailable without learning anything from the owner's private library.
