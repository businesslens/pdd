---
kind: primary
routes:
  web-saved-items: Web — Saved items
  web-unread-library: Web — Unread library
  mobile-saved-items: Mobile — Saved items
  mobile-unread-library: Mobile — Unread library
steps:
  - text: The Reader removes the item's saved state
    kind: actor
    actor: reader
    places:
      web-saved-items: reader-web::personal-library::saved-items
      web-unread-library: reader-web::personal-library::unread-library
      mobile-saved-items: reader-mobile::personal-library::saved-items
      mobile-unread-library: reader-mobile::personal-library::unread-library
  - text: The Product preserves the item's reading state
    kind: product
    places:
      web-saved-items: reader-web::personal-library::saved-items
      web-unread-library: reader-web::personal-library::unread-library
      mobile-saved-items: reader-mobile::personal-library::saved-items
      mobile-unread-library: reader-mobile::personal-library::unread-library
  - text: Collection membership is left for the Reader to change separately
    kind: condition
    places:
      web-saved-items: reader-web::personal-library::saved-items
      web-unread-library: reader-web::personal-library::unread-library
      mobile-saved-items: reader-mobile::personal-library::saved-items
      mobile-unread-library: reader-mobile::personal-library::unread-library
---

# Remove a saved item

## Trigger

The Reader chooses to stop keeping a saved library item.

## Outcome

The item is no longer saved and no unrelated reading or collection state changes.
