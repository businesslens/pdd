---
kind: primary
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Owner enters words they remember
    kind: actor
    actor: owner
    entities: []
    contexts:
      web:
        place: bookmarks-web::library
      mobile:
        place: bookmarks-mobile::library
  - text: The Product presents the bookmarks whose title, address, note or tags match, newest first
    kind: product
    actor: owner
    entities:
      - { entity: bookmark, effect: reads, facts: [Title, Address, Note, Tags, Saved at] }
      - { entity: tag, effect: reads, facts: [] }
    contexts:
      web:
        place: bookmarks-web::library
      mobile:
        place: bookmarks-mobile::library
  - text: The Owner opens the page a found bookmark leads to
    kind: actor
    actor: owner
    entities:
      - { entity: bookmark, effect: reads, facts: [Address] }
    contexts:
      web:
        place: bookmarks-web::library
      mobile:
        place: bookmarks-mobile::library
  - text: Nothing in the library changes by being found
    kind: condition
    entities:
      - { entity: bookmark, effect: reads, facts: [] }
    contexts:
      web:
        place: bookmarks-web::library
      mobile:
        place: bookmarks-mobile::library
---

# Find a bookmark by search

## Trigger

The Owner remembers something about a link but not where it is filed.

## Outcome

The page the Owner was looking for is open, found from a few words, with
nothing in the library changed.

## Edge cases

- Nothing matches → the Owner is told that the library holds no match, and the words stay available to change.
