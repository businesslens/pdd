---
kind: primary
actors: [reader]
result: achieved
steps:
  - text: Unread items are shown in newest-first order
  - text: The Reader opens and reads an item
    capability: content-reading
    routes:
      web: reader-web::personal-library
      mobile: reader-mobile::personal-library
  - text: The item is marked read
    capability: reading-state
    routes:
      web: reader-web::personal-library
      mobile: reader-mobile::personal-library
---

# Work through the unread backlog

## Trigger

The Reader opens a library containing unread items.

## Outcome

The Journey goal is achieved: the Reader consumed an item and the unread count is smaller.
