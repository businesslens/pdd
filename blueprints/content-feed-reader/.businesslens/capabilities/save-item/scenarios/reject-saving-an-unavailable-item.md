---
kind: validation
routes:
  web: Web
  mobile: Mobile
  mobile-next: Mobile (next)
steps:
  - text: The Product confirms that the item is unavailable
    kind: product
    entities:
      - { entity: item, effect: reads }
    contexts:
      web:
        place: reader-web::personal-library::unread-library
      mobile:
        place: reader-mobile::personal-library::unread-library
      mobile-next:
        place: reader-mobile::personal-library-next::unread-library
  - text: No saved record is created
    kind: condition
    entities: []
    contexts:
      web:
        place: reader-web::personal-library::unread-library
      mobile:
        place: reader-mobile::personal-library::unread-library
      mobile-next:
        place: reader-mobile::personal-library-next::unread-library
  - text: The Reader sees that the item cannot be saved
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
---

# Reject saving an unavailable item

## Trigger

The Reader attempts to save an item no longer available in the library.

## Outcome

The saved library is unchanged and contains no unusable item.
