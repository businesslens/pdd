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
  - text: The page does not answer, so no title can be read from it
    kind: condition
    entities: []
    contexts:
      web:
        place: bookmarks-web::save-link
      mobile:
        place: bookmarks-mobile::save-link
  - text: The Product offers the address itself as the title
    kind: product
    actor: owner
    entities: []
    contexts:
      web:
        place: bookmarks-web::save-link
      mobile:
        place: bookmarks-mobile::save-link
  - text: The Owner keeps or changes the title and saves
    kind: actor
    actor: owner
    entities: []
    contexts:
      web:
        place: bookmarks-web::save-link
      mobile:
        place: bookmarks-mobile::save-link
  - text: The Product adds the bookmark to the library
    kind: product
    actor: owner
    entities:
      - { entity: bookmark, effect: creates, facts: [Title, Address, Note, Tags, Collection, Saved at, Imported from folder] }
    contexts:
      web:
        place: bookmarks-web::save-link
      mobile:
        place: bookmarks-mobile::save-link
---

# Save a page that cannot be reached

## Trigger

The Owner saves a page that is offline, slow or behind a sign-in the Product
cannot pass.

## Outcome

The bookmark is kept with the address, or the Owner's own title, as its title.
