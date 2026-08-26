---
kind: primary
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Reader saves the item
    kind: actor
    actor: reader
    contexts:
      web:
        place: reader-web::personal-library::unread-library
      mobile:
        place: reader-mobile::personal-library::unread-library
  - text: The Product records the saved state independently of reading state
    kind: product
    contexts:
      web:
        place: reader-web::personal-library::unread-library
      mobile:
        place: reader-mobile::personal-library::unread-library
---

# Save an accessible item

## Trigger

The Reader chooses to keep an item available in the private library.

## Outcome

The item remains saved until the Reader explicitly removes it.
