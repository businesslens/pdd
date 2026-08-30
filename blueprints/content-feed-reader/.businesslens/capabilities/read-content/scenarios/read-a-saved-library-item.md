---
kind: primary
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Product presents the readable item with its source and publication context
    kind: product
    reads:
      - item
    contexts:
      web:
        place: reader-web::personal-library::saved-items
      mobile:
        place: reader-mobile::personal-library::saved-items
  - text: The Reader consumes the item from the saved library
    kind: actor
    actor: reader
    contexts:
      web:
        place: reader-web::personal-library::saved-items
      mobile:
        place: reader-mobile::personal-library::saved-items
  - text: The saved state remains unchanged unless the Reader explicitly removes it
    kind: product
    contexts:
      web:
        place: reader-web::personal-library::saved-items
      mobile:
        place: reader-mobile::personal-library::saved-items
---

# Read a saved library item

## Trigger

The Reader opens an item they previously chose to save.

## Outcome

The Reader can return to worthwhile content without depending on unread state
or collection membership.
