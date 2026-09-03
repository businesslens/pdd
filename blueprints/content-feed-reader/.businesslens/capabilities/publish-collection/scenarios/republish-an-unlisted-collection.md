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
  - text: The Product explains that the former public address will serve the collection again
    kind: product
    actor: reader
    entities:
      - { entity: collection, effect: reads }
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
  - text: The Reader confirms publication
    kind: actor
    actor: reader
    entities:
      - { entity: collection, from: Unlisted, to: Published }
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
  - text: The public address serves the collection contents again
    kind: condition
    actor: reader
    entities:
      - { entity: collection, effect: reads }
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
---

# Republish an unlisted collection

## Trigger

The Reader chooses to publish an owned collection they unlisted earlier.

## Outcome

The owned collection is publicly readable again at its former public address,
and nothing the owner changed while it was unlisted is lost.
