---
kind: primary
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Owner picks a collection
    kind: actor
    actor: owner
    entities:
      - { entity: collection, effect: reads, facts: [Name] }
    contexts:
      web:
        place: bookmarks-web::library
      mobile:
        place: bookmarks-mobile::library
  - text: The Product presents the bookmarks filed in it, newest first
    kind: product
    actor: owner
    entities:
      - { entity: collection, effect: reads, facts: [Name] }
      - { entity: bookmark, effect: reads, facts: [Title, Address, Saved at] }
    contexts:
      web:
        place: bookmarks-web::collection
      mobile:
        place: bookmarks-mobile::library
  - text: The Owner opens one of its bookmarks
    kind: actor
    actor: owner
    entities:
      - { entity: bookmark, effect: reads, facts: [Title] }
    contexts:
      web:
        place: bookmarks-web::collection
      mobile:
        place: bookmarks-mobile::library
---

# Browse a collection

## Trigger

The Owner wants to look through what they filed in one collection.

## Outcome

The Owner sees the collection's bookmarks and has the one they wanted open.

## Edge cases

- The collection is empty → the Owner is told so, and the collection stays.
