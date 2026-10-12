---
kind: validation
routes:
  web: Web
steps:
  - text: The Owner chooses to rename the open notebook and gives it the name of another notebook they have
    kind: actor
    actor: owner
    entities:
      - { entity: notebook, as: renamed, effect: reads, facts: [Name] }
    contexts:
      web:
        place: notes-web::notebook
  - text: The Product finds another notebook with that name
    kind: product
    actor: owner
    entities:
      - { entity: notebook, as: other, effect: reads, facts: [Name] }
    contexts:
      web:
        place: notes-web::notebook
  - text: The Product says the name is taken and keeps the typed name to change
    kind: product
    entities: []
    contexts:
      web:
        place: notes-web::notebook
---

# Refuse a new notebook name already in use

## Trigger

The Owner renames a notebook to the name of another notebook they have.

## Outcome

Both notebooks keep their names and their notes, and the Owner can change the
typed name and try again.

## Edge cases

- The name differs from the other notebook's only in capital letters → it counts as the same name and is refused.
