---
kind: primary
routes:
  web: Web
steps:
  - text: The Owner chooses to save a link into the collection they have open
    kind: actor
    actor: owner
    entities:
      - { entity: collection, effect: reads, facts: [Name] }
    contexts:
      web:
        place: bookmarks-web::collection
  - text: The Product opens Save link with that collection chosen
    kind: product
    actor: owner
    entities:
      - { entity: collection, effect: reads, facts: [Name] }
    contexts:
      web:
        place: bookmarks-web::save-link
  - text: The Owner brings the page's address, keeps or changes its title, and saves
    kind: actor
    actor: owner
    entities: []
    contexts:
      web:
        place: bookmarks-web::save-link
  - text: The Product adds the bookmark to the library, filed in that collection
    kind: product
    actor: owner
    entities:
      - { entity: bookmark, effect: creates, facts: [Title, Address, Note, Tags, Collection, Saved at, Imported from folder] }
      - { entity: collection, effect: reads, facts: [] }
    contexts:
      web:
        place: bookmarks-web::save-link
---

# Save a link into an open collection

## Trigger

The Owner is looking at a collection and has a page that belongs in it.

## Outcome

The page is a bookmark filed in that collection.
