---
kind: validation
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
  - text: The Owner gives it the name of a collection the library already has
    kind: actor
    actor: owner
    entities:
      - { entity: collection, effect: reads, facts: [] }
    contexts:
      web:
        place: bookmarks-web
  - text: The Product finds a collection with that name
    kind: product
    actor: owner
    entities:
      - { entity: collection, effect: reads, facts: [Name] }
    contexts:
      web:
        place: bookmarks-web
  - text: The Product explains that the name is already in use
    kind: product
    actor: owner
    entities: []
    contexts:
      web:
        place: bookmarks-web
---

# Refuse a name already in use

## Trigger

The Owner names a new collection the same as an existing one.

## Outcome

No collection is created, and the name stays in place for the Owner to change.
