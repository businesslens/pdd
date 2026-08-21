---
kind: edge
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Reader selects the source in the unread library
    kind: actor
    actor: reader
    places:
      web: reader-web::personal-library::unread-library
      mobile: reader-mobile::personal-library::unread-library
  - text: The Product shows how many items will be marked read
    kind: product
    places:
      web: reader-web::personal-library::unread-library
      mobile: reader-mobile::personal-library::unread-library
  - text: The Reader confirms the bulk action
    kind: actor
    actor: reader
    places:
      web: reader-web::personal-library::unread-library
      mobile: reader-mobile::personal-library::unread-library
---

# Mark one source read in bulk

## Trigger

The Reader decides not to inspect the remaining unread items from one source.

## Outcome

Every unread item from that source is marked read without unfollowing the source or removing saved items.
