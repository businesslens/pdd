---
kind: validation
routes:
  web: Web
steps:
  - text: The Reader chooses to publish a private owned collection
    kind: actor
    actor: reader
    entities:
      - { entity: collection, effect: reads, facts: [] }
    contexts:
      web:
        place: reader-web::personal-library::collection-detail
  - text: The Product confirms ownership
    kind: product
    actor: reader
    entities:
      - { entity: collection, effect: reads, facts: [] }
    contexts:
      web:
        place: reader-web::personal-library::collection-detail
  - text: Public sharing is switched off for the Product
    kind: condition
    entities:
      - { entity: reader-settings, effect: reads, facts: [Public sharing enabled] }
    contexts:
      web:
        place: reader-web::personal-library::collection-detail
  - text: The Product explains that publishing is unavailable and why
    kind: product
    actor: reader
    entities: []
    contexts:
      web:
        place: reader-web::personal-library::collection-detail
  - text: The collection stays private, with no public address
    kind: condition
    actor: reader
    entities:
      - { entity: collection, effect: reads, facts: [] }
    contexts:
      web:
        place: reader-web::personal-library::collection-detail
---

# Refuse publishing while sharing is off

## Trigger

The Reader chooses to publish a private owned collection while public sharing
is switched off for the Product.

## Outcome

The collection is not published, the Reader knows why, and nothing about the
collection changed.

## Edge cases

- The collection was already published before sharing was switched off → it stays published and readable; only new publication is refused.
