---
kind: primary
routes:
  web: Web
steps:
  - text: The Owner chooses to rename the open collection
    kind: actor
    actor: owner
    entities:
      - { entity: collection, effect: reads, facts: [Name] }
    contexts:
      web:
        place: bookmarks-web::collection
  - text: The Owner gives it a new name
    kind: actor
    actor: owner
    entities: []
    contexts:
      web:
        place: bookmarks-web::collection
  - text: The Product records the new name
    kind: product
    actor: owner
    entities:
      - { entity: collection, effect: changes, facts: [Name] }
    contexts:
      web:
        place: bookmarks-web::collection
  - text: The bookmarks filed in it stay filed there, unchanged
    kind: condition
    entities:
      - { entity: bookmark, effect: reads, facts: [] }
    contexts:
      web:
        place: bookmarks-web::collection
---

# Rename a collection

## Trigger

The Owner wants a collection called something that says better what it holds.

## Outcome

The collection has its new name and holds exactly what it held before.

## Edge cases

- The new name belongs to another collection → the rename is refused as in creation, and the name stays to change.
