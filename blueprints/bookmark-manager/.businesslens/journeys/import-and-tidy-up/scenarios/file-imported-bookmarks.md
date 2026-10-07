---
kind: primary
result: achieved
routes:
  web: Web
steps:
  - text: The Owner imports the export file their browser made
    kind: actor
    actor: owner
    capability: import-bookmarks
    entities: []
    contexts:
      web:
        place: bookmarks-web::import
  - text: The Product adds the bookmarks the library does not already keep, Unsorted
    kind: product
    actor: owner
    capability: import-bookmarks
    entities:
      - { entity: bookmark, as: imported, effect: creates, facts: [Title, Address, Note, Tags, Collection, Saved at, Imported from folder] }
    contexts:
      web:
        place: bookmarks-web::import
  - text: The Product takes the Owner to the Library, narrowed to the Unsorted bookmarks it added
    kind: product
    actor: owner
    capability: import-bookmarks
    entities:
      - { entity: bookmark, as: imported, effect: reads, facts: [Title, Address, Imported from folder] }
    contexts:
      web:
        place: bookmarks-web::library
  - text: The Owner opens an imported bookmark and chooses its collection
    kind: actor
    actor: owner
    capability: edit-bookmark
    entities:
      - { entity: bookmark, as: imported, effect: reads, facts: [Title, Address, Imported from folder] }
      - { entity: collection, effect: reads, facts: [Name] }
    contexts:
      web:
        place: bookmarks-web::bookmark
  - text: The Product files the bookmark in that collection
    kind: product
    actor: owner
    capability: edit-bookmark
    entities:
      - { entity: bookmark, as: imported, effect: changes, facts: [Collection] }
      - { entity: collection, effect: reads, facts: [] }
    contexts:
      web:
        place: bookmarks-web::bookmark
---

# File imported bookmarks

## Trigger

The Owner imports their browser's bookmarks and files them.

## Outcome

The Journey goal is achieved: the imported bookmarks are filed in the
collections the Owner chose, one by one.
