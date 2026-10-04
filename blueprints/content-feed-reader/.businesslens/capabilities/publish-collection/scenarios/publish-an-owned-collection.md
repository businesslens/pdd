---
kind: primary
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
        place: reader-web::personal-library::collection-workspace::settings::sharing
  - text: The Product explains that the collection will become readable by link
    kind: product
    actor: reader
    entities:
      - { entity: collection, effect: reads, facts: [] }
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace::settings::sharing
  - text: The Reader confirms publication
    kind: actor
    actor: reader
    entities:
      - { entity: collection, from: Private, to: Published, facts: [Public address] }
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace::settings::sharing
  - text: The Product shows the stable public address the collection is now served at
    kind: product
    actor: reader
    entities:
      - { entity: collection, effect: reads, facts: [Public address] }
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace::settings::sharing
---

# Publish an owned collection

## Trigger

The Reader chooses to publish a private owned collection.

## Outcome

The owned collection is publicly readable at the stable web address.
