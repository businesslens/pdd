---
kind: primary
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Reader marks the item read
    kind: actor
    actor: reader
    places:
      web: reader-web::personal-library::unread-library
      mobile: reader-mobile::personal-library::unread-library
  - text: The Product updates the item's private reading state
    kind: product
    places:
      web: reader-web::personal-library::unread-library
      mobile: reader-mobile::personal-library::unread-library
  - text: The unread count decreases
    kind: condition
    places:
      web: reader-web::personal-library::unread-library
      mobile: reader-mobile::personal-library::unread-library
---

# Mark an item read

## Trigger

The Reader finishes an unread library item.

## Outcome

The item is read for that Reader and no longer contributes to the unread count.
