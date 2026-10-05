---
kind: edge
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Owner brings the address of a page to keep
    kind: actor
    actor: owner
    entities: []
    contexts:
      web:
        place: bookmarks-web::save-link
      mobile:
        place: bookmarks-mobile::save-link
  - text: The library already keeps a bookmark with exactly this address
    kind: condition
    entities:
      - { entity: bookmark, effect: reads, facts: [Address] }
    contexts:
      web:
        place: bookmarks-web::save-link
      mobile:
        place: bookmarks-mobile::save-link
  - text: The Product opens the bookmark already kept instead of adding a second one
    kind: product
    actor: owner
    entities:
      - { entity: bookmark, effect: reads, facts: [Title, Address, Collection, Saved at] }
    contexts:
      web:
        place: bookmarks-web::bookmark
      mobile:
        place: bookmarks-mobile::bookmark
---

# Save an address already kept

## Trigger

The Owner saves a page whose address the library already keeps.

## Outcome

The library still holds one bookmark for the address, and the Owner is looking
at it, with when it was saved and where it is filed.
