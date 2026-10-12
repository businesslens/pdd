---
kind: validation
routes:
  web: Web
steps:
  - text: The Owner chooses to create a notebook and gives it the name of one they already have
    kind: actor
    actor: owner
    entities:
      - { entity: notebook, effect: reads, facts: [Name] }
    contexts:
      web:
        place: notes-web::notebooks
  - text: The Product finds a notebook with that name
    kind: product
    actor: owner
    entities:
      - { entity: notebook, effect: reads, facts: [Name] }
    contexts:
      web:
        place: notes-web::notebooks
  - text: The Product says the name is taken and keeps the typed name to change
    kind: product
    entities: []
    contexts:
      web:
        place: notes-web::notebooks
---

# Refuse a notebook name already in use

## Trigger

The Owner names a new notebook the same as one they already have.

## Outcome

No notebook is created, the existing one is unchanged, and the Owner can change
the name and try again.

## Edge cases

- The name differs from an existing one only in capital letters → it counts as the same name and is refused.
