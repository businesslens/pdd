---
kind: primary
routes:
  web: Web
  mobile: Mobile
  mobile-source-focused: Mobile — source-focused
steps:
  - text: The Reader saves the item
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
  - text: The Product records the saved state independently of reading state
    kind: product
    actor: reader
    entities:
      - { entity: item, facts: [ Saved at ] }
    contexts:
      web:
        place: reader-web::personal-library::unread-library
      mobile:
        place: reader-mobile::personal-library::unread-library
      mobile-source-focused:
        place: reader-mobile::source-focused-library::unread-library
---

# Save an accessible item

## Trigger

The Reader chooses to keep an item available in the private library.

## Outcome

The item remains saved until the Reader explicitly removes it.
