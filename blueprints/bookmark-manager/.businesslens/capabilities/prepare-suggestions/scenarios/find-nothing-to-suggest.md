---
kind: edge
routes:
  web: Web
steps:
  - text: The Owner asks for suggestions
    kind: actor
    actor: owner
    entities: []
    contexts:
      web:
        place: bookmarks-web::suggestions
  - text: The assistant reads the Unsorted bookmarks with the collections and tags the library already has
    kind: actor
    actor: assistant
    entities:
      - { entity: bookmark, effect: reads, facts: [Title, Address, Note, Tags, Imported from folder] }
      - { entity: collection, effect: reads, facts: [Name] }
      - { entity: tag, effect: reads, facts: [Name] }
  - text: The assistant finds no bookmarks that belong together and no page kept twice
    kind: condition
    actor: assistant
    entities:
      - { entity: bookmark, effect: reads, facts: [] }
  - text: The Product tells the Owner there is nothing to suggest
    kind: product
    actor: owner
    entities: []
    contexts:
      web:
        place: bookmarks-web::suggestions
---

# Find nothing to suggest

## Trigger

The Owner asks for suggestions when the library is already tidy.

## Outcome

No suggestion is created, the Owner knows why, and the library is unchanged.
