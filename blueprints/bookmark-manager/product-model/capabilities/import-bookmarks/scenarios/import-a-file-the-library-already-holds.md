---
kind: edge
routes:
  web: Web
steps:
  - text: The Owner chooses the export file their browser made
    kind: actor
    actor: owner
    entities: []
    contexts:
      web:
        place: bookmarks-web::import
  - text: The Product reads the bookmarks and the folders they sit in
    kind: product
    actor: owner
    entities:
      - { entity: bookmark, effect: reads, facts: [] }
    contexts:
      web:
        place: bookmarks-web::import
  - text: The library already keeps every address in the file
    kind: condition
    actor: owner
    entities:
      - { entity: bookmark, effect: reads, facts: [Address] }
    contexts:
      web:
        place: bookmarks-web::import
  - text: The Product reports that nothing was added and every bookmark was skipped
    kind: product
    actor: owner
    entities:
      - { entity: bookmark, effect: reads, facts: [] }
    contexts:
      web:
        place: bookmarks-web::import
---

# Import a file the library already holds

## Trigger

The Owner imports a file whose bookmarks all came in before.

## Outcome

The library is unchanged, and the Owner stays on Import knowing why.
