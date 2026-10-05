---
kind: primary
result: achieved
routes:
  web: Web
steps:
  - text: The Owner brings the address of a page to keep
    kind: actor
    actor: owner
    capability: save-bookmark
    entities: []
    contexts:
      web:
        place: bookmarks-web::save-link
  - text: The Owner chooses to make a new collection for it
    kind: actor
    actor: owner
    capability: create-collection
    entities:
      - { entity: collection, effect: reads, facts: [] }
    contexts:
      web:
        place: bookmarks-web::save-link
  - text: The Product creates the collection with the name the Owner gives
    kind: product
    actor: owner
    capability: create-collection
    entities:
      - { entity: collection, effect: creates, facts: [Name] }
    contexts:
      web:
        place: bookmarks-web::save-link
  - text: The Owner saves the bookmark into the new collection
    kind: actor
    actor: owner
    capability: save-bookmark
    entities:
      - { entity: collection, effect: reads, facts: [Name] }
      - { entity: bookmark, effect: reads, facts: [] }
    contexts:
      web:
        place: bookmarks-web::save-link
  - text: The Product adds the bookmark to the library, filed in that collection
    kind: product
    actor: owner
    capability: save-bookmark
    entities:
      - { entity: bookmark, effect: creates, facts: [Title, Address, Note, Tags, Collection, Saved at, Imported from folder] }
      - { entity: collection, effect: reads, facts: [] }
    contexts:
      web:
        place: bookmarks-web::save-link
---

# Save a link into a new collection

## Trigger

The Owner finds a page on a subject they have no collection for yet.

## Outcome

The Journey goal is achieved: the page is a bookmark filed in the collection the
Owner made for it while saving.
