---
kind: primary
routes:
  web: Web
steps:
  - text: While saving a link, the Owner chooses to make a new collection for it
    kind: actor
    actor: owner
    entities:
      - { entity: collection, effect: reads, facts: [] }
    contexts:
      web:
        place: bookmarks-web::save-link
  - text: The Owner gives it a name
    kind: actor
    actor: owner
    entities: []
    contexts:
      web:
        place: bookmarks-web::save-link
  - text: The Product creates the empty collection
    kind: product
    actor: owner
    entities:
      - { entity: collection, effect: creates, facts: [Name] }
    contexts:
      web:
        place: bookmarks-web::save-link
  - text: The Product chooses the new collection for the link being saved, which is not saved yet
    kind: product
    actor: owner
    entities:
      - { entity: collection, effect: reads, facts: [Name] }
    contexts:
      web:
        place: bookmarks-web::save-link
---

# Create a collection while saving a link

## Trigger

The Owner is saving a page on a subject they have no collection for yet.

## Outcome

The library has a new, empty collection, and the Owner is still saving the
link, with the new collection chosen for it.

## Edge cases

- The Owner leaves without saving the link → the new collection stays, empty.
