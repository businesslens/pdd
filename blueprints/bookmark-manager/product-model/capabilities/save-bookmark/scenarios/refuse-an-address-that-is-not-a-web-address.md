---
kind: validation
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Owner brings text that is not a web address
    kind: actor
    actor: owner
    entities: []
    contexts:
      web:
        place: bookmarks-web::save-link
      mobile:
        place: bookmarks-mobile::save-link
  - text: The Product finds no web address to save
    kind: product
    actor: owner
    entities: []
    contexts:
      web:
        place: bookmarks-web::save-link
      mobile:
        place: bookmarks-mobile::save-link
  - text: The Product explains that only a web address can be saved
    kind: product
    actor: owner
    entities: []
    contexts:
      web:
        place: bookmarks-web::save-link
      mobile:
        place: bookmarks-mobile::save-link
---

# Refuse an address that is not a web address

## Trigger

The Owner tries to save something that is not a web address, such as a
sentence copied from a page.

## Outcome

No bookmark is added, and the text stays in place for the Owner to correct.
