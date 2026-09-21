---
kind: primary
routes:
  web: Web
  mobile: Mobile
  mobile-next: Mobile (next)
steps:
  - text: The Reader saves the item
    kind: actor
    actor: reader
    entities:
      - { entity: item, effect: reads }
    contexts:
      web:
        place: reader-web::personal-library::unread-library
      mobile:
        place: reader-mobile::personal-library::unread-library
      mobile-next:
        place: reader-mobile::personal-library-next::unread-library
  - text: The Product records the saved state independently of reading state
    kind: product
    actor: reader
    entities:
      - { entity: item }
    contexts:
      web:
        place: reader-web::personal-library::unread-library
      mobile:
        place: reader-mobile::personal-library::unread-library
      mobile-next:
        place: reader-mobile::personal-library-next::unread-library
---

# Save an accessible item

## Trigger

The Reader chooses to keep an item available in the private library.

## Outcome

The item remains saved until the Reader explicitly removes it.
