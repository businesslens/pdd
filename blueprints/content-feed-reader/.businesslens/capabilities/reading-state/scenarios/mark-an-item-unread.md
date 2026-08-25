---
kind: edge
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Reader marks the item unread
    kind: actor
    actor: reader
    contexts:
      web:
        place: reader-web::personal-library::unread-library
      mobile:
        place: reader-mobile::personal-library::unread-library
  - text: The Product updates the item's private reading state
    kind: product
    contexts:
      web:
        place: reader-web::personal-library::unread-library
      mobile:
        place: reader-mobile::personal-library::unread-library
  - text: The unread count increases
    kind: condition
    contexts:
      web:
        place: reader-web::personal-library::unread-library
      mobile:
        place: reader-mobile::personal-library::unread-library
---

# Mark an item unread

## Trigger

The Reader wants a read library item to return to the unread backlog.

## Outcome

The item is unread for that Reader without changing its saved or collection state.
