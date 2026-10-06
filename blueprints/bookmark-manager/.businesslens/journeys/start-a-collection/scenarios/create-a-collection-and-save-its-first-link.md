---
kind: primary
result: achieved
routes:
  web: Web
steps:
  - text: The Owner chooses to make a new collection and gives it a name
    kind: actor
    actor: owner
    capability: create-collection
    entities:
      - { entity: collection, effect: reads, facts: [] }
    contexts:
      web:
        place: bookmarks-web
  - text: The Product creates the empty collection
    kind: product
    actor: owner
    capability: create-collection
    entities:
      - { entity: collection, effect: creates, facts: [Name] }
    contexts:
      web:
        place: bookmarks-web
  - text: The Product takes the Owner into the new, empty collection
    kind: product
    actor: owner
    capability: create-collection
    entities:
      - { entity: collection, effect: reads, facts: [Name] }
    contexts:
      web:
        place: bookmarks-web::collection
  - text: The Owner chooses to save a link into the collection
    kind: actor
    actor: owner
    capability: save-bookmark
    entities:
      - { entity: collection, effect: reads, facts: [Name] }
    contexts:
      web:
        place: bookmarks-web::collection
  - text: The Owner brings the page's address, keeps or changes its title, and saves
    kind: actor
    actor: owner
    capability: save-bookmark
    entities: []
    contexts:
      web:
        place: bookmarks-web::save-link
  - text: The Product adds the bookmark to the library, filed in the new collection
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

# Create a collection and save its first link

## Trigger

The Owner starts collecting links on a subject they have no collection for.

## Outcome

The Journey goal is achieved: the new collection holds its first bookmark.
