---
kind: edge
routes:
  web: Web
steps:
  - text: The Product confirms ownership
    kind: product
    actor: reader
    entities:
      - { entity: collection, effect: reads }
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
  - text: The Product explains that the public link will stop working
    kind: product
    entities: []
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
  - text: The Reader confirms unlisting
    kind: actor
    actor: reader
    entities:
      - { entity: collection, from: Published, to: Unlisted }
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
---

# Unlist an owned collection

## Trigger

The Reader revokes public access to an owned published collection.

## Outcome

The collection is private and its former public address serves no contents.
