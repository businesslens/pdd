---
kind: edge
routes:
  web: Web
steps:
  - text: A Visitor opens a public address after its owner has unpublished the collection.
    kind: actor
    actor: visitor
    entities:
      - { entity: collection, effect: reads, facts: [] }
    contexts:
      web:
        place: reader-web::public-reading::public-collection
  - text: The Product determines that the collection is no longer public
    kind: product
    actor: visitor
    entities:
      - { entity: collection, effect: reads, facts: [] }
    contexts:
      web:
        place: reader-web::public-reading::public-collection
  - text: Collection contents are withheld
    kind: product
    actor: visitor
    entities:
      - { entity: collection, effect: reads, facts: [] }
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

# Open an unpublished collection

## Trigger

A Visitor opens a public address after its owner has unpublished the collection.

## Outcome

The Visitor sees that the collection is unavailable without learning anything from the owner's private library.

## Edge cases

- The owner deleted the collection → the address shows the same neutral unavailable state.
