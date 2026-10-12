---
kind: primary
routes:
  web: Web
steps:
  - text: The Owner chooses to make a new collection
    kind: actor
    actor: owner
    entities:
      - { entity: collection, effect: reads, facts: [] }
    contexts:
      web:
        place: bookmarks-web
  - text: The Owner gives it a name
    kind: actor
    actor: owner
    entities: []
    contexts:
      web:
        place: bookmarks-web
  - text: The Product creates the empty collection
    kind: product
    actor: owner
    entities:
      - { entity: collection, effect: creates, facts: [Name] }
    contexts:
      web:
        place: bookmarks-web
  - text: The Product opens the new collection, ready to file bookmarks in
    kind: product
    actor: owner
    entities:
      - { entity: collection, effect: reads, facts: [Name] }
      - { entity: bookmark, effect: reads, facts: [] }
    contexts:
      web:
        place: bookmarks-web::collection
---

# Create a collection

## Trigger

The Owner wants a new place to file bookmarks on one subject.

## Outcome

The library has a new, empty collection with the name the Owner gave it.
