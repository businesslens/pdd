---
kind: primary
result: achieved
steps:
  - text: Unread items are shown in newest-first order
    kind: product
  - text: The Reader opens and reads an item
    kind: actor
    actor: reader
    capability: read-content
    contexts:
      web:
        place: reader-web::personal-library::unread-library
      mobile:
        place: reader-mobile::personal-library::unread-library
  - text: The item is marked read
    kind: product
    capability: track-reading-state
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
