---
kind: edge
routes:
  web: Web
steps:
  - text: The Product confirms ownership
    kind: product
    actor: reader
    entities:
      - { entity: collection, effect: reads, facts: [] }
    contexts:
      web:
        place: reader-web::personal-library::collection-detail
  - text: The Product explains that the public link will stop working
    kind: product
    entities: []
    contexts:
      web:
        place: reader-web::personal-library::collection-detail
  - text: The Reader confirms unpublishing
    kind: actor
    actor: reader
    entities:
      - { entity: collection, from: Published, to: Unpublished, facts: [] }
    contexts:
      web:
        place: reader-web::personal-library::collection-detail
---

# Unpublish an owned collection

## Trigger

The Reader revokes public access to an owned published collection.

## Outcome

The collection is unpublished: its former public address serves no contents, and
the collection itself stays in the owner's library, private to them until they
publish it again.

## Edge cases

- The Reader declines to confirm → the collection stays published and its address keeps serving it.
