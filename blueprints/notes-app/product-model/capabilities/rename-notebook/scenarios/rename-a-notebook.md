---
kind: primary
routes:
  web: Web
steps:
  - text: The Owner chooses to rename the open notebook and gives it a new name
    kind: actor
    actor: owner
    entities:
      - { entity: notebook, effect: reads, facts: [Name] }
    contexts:
      web:
        place: notes-web::notebook
  - text: The Product checks that no other notebook of the Owner's has that name
    kind: product
    actor: owner
    entities:
      - { entity: notebook, effect: reads, facts: [Name] }
    contexts:
      web:
        place: notes-web::notebook
  - text: The Product keeps the new name
    kind: product
    actor: owner
    entities:
      - { entity: notebook, facts: [Name] }
    contexts:
      web:
        place: notes-web::notebook
  - text: The notebook shows its new name and still holds the same notes
    kind: condition
    actor: owner
    entities:
      - { entity: notebook, effect: reads, facts: [Name] }
      - { entity: note, effect: reads, facts: [Title, Notebook] }
    contexts:
      web:
        place: notes-web::notebook
---

# Rename a notebook

## Trigger

The Owner wants a notebook's name to say better what is filed in it.

## Outcome

The notebook has the new name, every note filed in it stays filed there, and
the new name is offered wherever the Owner files a note.

## Edge cases

- The new name differs from the current one only in capital letters → it is kept, since no other notebook has it.
