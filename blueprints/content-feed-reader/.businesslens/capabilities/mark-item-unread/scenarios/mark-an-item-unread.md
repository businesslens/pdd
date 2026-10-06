---
kind: primary
routes:
  web: Web
  mobile: Mobile
  mobile-source-focused: Mobile — source-focused
steps:
  - text: The Reader marks the item unread
    kind: actor
    actor: reader
    entities:
      - { entity: item, effect: reads, facts: [] }
    contexts:
      web:
        place: reader-web::personal-library::unread-library
      mobile:
        place: reader-mobile::personal-library::unread-library
      mobile-source-focused:
        place: reader-mobile::source-focused-library::unread-library
  - text: The Product updates the item's private reading state
    kind: product
    actor: reader
    entities:
      - { entity: item, from: Read, to: Unread, facts: [] }
    contexts:
      web:
        place: reader-web::personal-library::unread-library
      mobile:
        place: reader-mobile::personal-library::unread-library
      mobile-source-focused:
        place: reader-mobile::source-focused-library::unread-library
  - text: The unread count increases
    kind: condition
    entities: []
    contexts:
      web:
        place: reader-web::personal-library::unread-library
      mobile:
        place: reader-mobile::personal-library::unread-library
      mobile-source-focused:
        place: reader-mobile::source-focused-library::unread-library
---

# Mark an item unread

## Trigger

The Reader wants a read library item to return to the unread backlog.

## Outcome

The item is unread for that Reader without changing its saved or collection state.
