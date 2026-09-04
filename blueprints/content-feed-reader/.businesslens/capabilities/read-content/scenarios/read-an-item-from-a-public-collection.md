---
kind: primary
routes:
  web: Web
steps:
  - text: The Visitor opens an item from a published collection
    kind: actor
    actor: visitor
    entities:
      - { entity: collection, effect: reads }
      - { entity: item, effect: reads }
    contexts:
      web:
        place: reader-web::item-reader
  - text: The Product presents the readable item with its source and publication context
    kind: product
    actor: visitor
    entities:
      - { entity: item, effect: reads }
      - { entity: source, effect: reads }
    contexts:
      web:
        place: reader-web::item-reader
  - text: No private reading state is created
    kind: condition
    entities: []
    contexts:
      web:
        place: reader-web::item-reader
---

# Read an item from a public collection

## Trigger

A Visitor opens an item inside a published collection.

## Outcome

The Visitor reads the item exactly as its Reader would, and the Product records
nothing about it.
