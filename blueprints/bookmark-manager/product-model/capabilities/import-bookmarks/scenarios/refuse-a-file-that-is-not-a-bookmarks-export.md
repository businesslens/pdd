---
kind: validation
routes:
  web: Web
steps:
  - text: The Owner chooses a file their browser did not export
    kind: actor
    actor: owner
    entities: []
    contexts:
      web:
        place: bookmarks-web::import
  - text: The Product finds no bookmarks it can read in the file
    kind: product
    actor: owner
    entities:
      - { entity: bookmark, effect: reads, facts: [] }
    contexts:
      web:
        place: bookmarks-web::import
  - text: The Product explains that the file is not a bookmarks export and how to make one
    kind: product
    actor: owner
    entities:
      - { entity: bookmark, effect: reads, facts: [] }
    contexts:
      web:
        place: bookmarks-web::import
---

# Refuse a file that is not a bookmarks export

## Trigger

The Owner chooses the wrong file, or one the Product cannot read.

## Outcome

Nothing is added to the library, and the Owner can choose another file.
