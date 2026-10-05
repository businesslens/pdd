---
kind: primary
routes:
  web: Web
steps:
  - text: The Owner chooses to create a notebook and gives it a name
    kind: actor
    actor: owner
    entities: 
      - { entity: notebook, effect: reads, facts: [Name] }
    contexts:
      web:
        place: notes-web::notebooks
  - text: The Product checks that no other notebook of the Owner's has that name
    kind: product
    actor: owner
    entities:
      - { entity: notebook, effect: reads, facts: [Name] }
    contexts:
      web:
        place: notes-web::notebooks
  - text: The Product creates the empty notebook
    kind: product
    actor: owner
    entities:
      - { entity: notebook, effect: creates, facts: [Name] }
    contexts:
      web:
        place: notes-web::notebooks
  - text: The new notebook is listed with the others, ready to file into
    kind: condition
    actor: owner
    entities:
      - { entity: notebook, effect: reads, facts: [Name] }
    contexts:
      web:
        place: notes-web::notebooks
---

# Create a notebook

## Trigger

The Owner wants a new place to file a kind of note.

## Outcome

An empty notebook with the chosen name exists and can be filed into.
