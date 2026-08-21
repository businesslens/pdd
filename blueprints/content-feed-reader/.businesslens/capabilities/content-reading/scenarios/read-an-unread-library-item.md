---
kind: primary
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Product presents the readable item with its source and publication context
    kind: product
    places:
      web: reader-web::personal-library::unread-library
      mobile: reader-mobile::personal-library::unread-library
  - text: The Reader consumes the item
    kind: actor
    actor: reader
    places:
      web: reader-web::personal-library::unread-library
      mobile: reader-mobile::personal-library::unread-library
  - text: The item remains available for an explicit reading-state or saving decision
    kind: condition
    places:
      web: reader-web::personal-library::unread-library
      mobile: reader-mobile::personal-library::unread-library
---

# Read an unread library item

## Trigger

The Reader opens an unread item from the private library.

## Outcome

The Reader can consume the item without the act of opening it silently changing durable state.
