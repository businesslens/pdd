---
kind: primary
routes:
  web: Web
  mobile: Mobile
  mobile-source-focused: Mobile — source-focused
steps:
  - text: The Product presents the readable item with its source and publication context
    kind: product
    entities:
      - { entity: item, effect: reads, facts: [ Title, Published at ] }
      - { entity: source, effect: reads, facts: [ Name ] }
    contexts:
      web:
        place: reader-web::item-reader
      mobile:
        place: reader-mobile::personal-library::unread-library
      mobile-source-focused:
        place: reader-mobile::source-focused-library::unread-library
  - text: The Reader consumes the item
    kind: actor
    actor: reader
    entities:
      - { entity: item, effect: reads, facts: [ Title, Published at ] }
    contexts:
      web:
        place: reader-web::item-reader
      mobile:
        place: reader-mobile::personal-library::unread-library
      mobile-source-focused:
        place: reader-mobile::source-focused-library::unread-library
  - text: The item remains available for an explicit track-reading-state or saving decision
    kind: condition
    entities:
      - { entity: item, effect: reads, facts: [] }
    contexts:
      web:
        place: reader-web::personal-library::unread-library
      mobile:
        place: reader-mobile::personal-library::unread-library
      mobile-source-focused:
        place: reader-mobile::source-focused-library::unread-library
---

# Read an unread library item

## Trigger

The Reader opens an unread item from the private library.

## Outcome

The Reader can consume the item without the act of opening it silently changing durable state.
