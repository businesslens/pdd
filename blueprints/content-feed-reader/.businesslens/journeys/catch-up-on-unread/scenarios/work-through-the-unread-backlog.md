---
kind: primary
result: achieved
steps:
  - text: Unread items are shown in newest-first order
    kind: product
    entities:
      - { entity: item, effect: reads }
  - text: The Reader opens and reads an item
    kind: actor
    actor: reader
    capability: read-content
    entities:
      - { entity: item, effect: reads }
    contexts:
      web:
        place: reader-web::personal-library::unread-library
      mobile:
        place: reader-mobile::personal-library::unread-library
  - text: The item is marked read
    kind: product
    actor: reader
    capability: track-reading-state
    entities:
      - { entity: item, from: Unread, to: Read }
    contexts:
      web:
        place: reader-web::personal-library::unread-library
      mobile:
        place: reader-mobile::personal-library::unread-library
routes:
  web: Web
  mobile: Mobile
---

# Work through the unread backlog

## Trigger

The Reader opens a library containing unread items.

## Outcome

The Journey goal is achieved: the Reader consumed an item and the unread count is smaller.
