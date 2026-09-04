---
kind: edge
result: achieved
steps:
  - text: The Reader reads the item
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
  - text: The Reader saves it
    kind: actor
    actor: reader
    capability: save-item
    entities:
      - { entity: item }
    contexts:
      web:
        place: reader-web::personal-library::unread-library
      mobile:
        place: reader-mobile::personal-library::unread-library
  - text: The Reader marks it read
    kind: actor
    actor: reader
    capability: track-reading-state
    entities:
      - { entity: item, from: Unread, to: Read }
    contexts:
      web:
        place: reader-web::personal-library::unread-library
      mobile:
        place: reader-mobile::personal-library::unread-library
  - text: The Product removes it from the unread backlog without removing the saved copy
    kind: product
    entities: []
routes:
  web: Web
  mobile: Mobile
---

# Save an item while catching up

## Trigger

The Reader finds a worthwhile item while reducing the unread backlog.

## Outcome

The Journey goal is achieved: the backlog is smaller and the item remains saved.
