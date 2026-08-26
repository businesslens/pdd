---
kind: validation
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Product confirms that the item is unavailable
    kind: product
    contexts:
      web:
        place: reader-web::personal-library::unread-library
      mobile:
        place: reader-mobile::personal-library::unread-library
  - text: No saved record is created
    kind: condition
    contexts:
      web:
        place: reader-web::personal-library::unread-library
      mobile:
        place: reader-mobile::personal-library::unread-library
  - text: The Reader sees that the item cannot be saved
    kind: actor
    actor: reader
    contexts:
      web:
        place: reader-web::personal-library::unread-library
      mobile:
        place: reader-mobile::personal-library::unread-library
---

# Reject saving an unavailable item

## Trigger

The Reader attempts to save an item no longer available in the library.

## Outcome

The saved library is unchanged and contains no unusable item.
