---
kind: primary
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Product presents the readable item with its source and publication context
    kind: product
    entities:
      - { entity: item, effect: reads }
      - { entity: source, effect: reads }
    contexts:
      web:
        place: reader-web::personal-library::unread-library
      mobile:
        place: reader-mobile::personal-library::unread-library
  - text: The Reader consumes the item
    kind: actor
    actor: reader
    entities:
      - { entity: item, effect: reads }
    contexts:
      web:
        place: reader-web::personal-library::unread-library
      mobile:
        place: reader-mobile::personal-library::unread-library
  - text: The item remains available for an explicit track-reading-state or saving decision
    kind: condition
    entities:
      - { entity: item, effect: reads }
    contexts:
      web:
        place: reader-web::personal-library::unread-library
      mobile:
        place: reader-mobile::personal-library::unread-library
---

# Read an unread library item

## Trigger

The Reader opens an unread item from the private library.

## Outcome

The Reader can consume the item without the act of opening it silently changing durable state.
