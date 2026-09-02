---
kind: edge
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Reader selects the source in the unread library
    kind: actor
    actor: reader
    entities:
      - { entity: source, effect: reads }
    contexts:
      web:
        place: reader-web::personal-library::unread-library
      mobile:
        place: reader-mobile::personal-library::unread-library
  - text: The Product shows how many items will be marked read
    kind: product
    entities:
      - { entity: item, effect: reads }
    contexts:
      web:
        place: reader-web::personal-library::unread-library
      mobile:
        place: reader-mobile::personal-library::unread-library
  - text: The Reader confirms the bulk action
    kind: actor
    actor: reader
    entities:
      - { entity: item, from: Unread, to: Read }
    contexts:
      web:
        place: reader-web::personal-library::unread-library
      mobile:
        place: reader-mobile::personal-library::unread-library
---

# Mark one source read in bulk

## Trigger

The Reader decides not to inspect the remaining unread items from one source.

## Outcome

Every unread item from that source is marked read without unfollowing the source or removing saved items.
