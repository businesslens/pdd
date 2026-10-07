---
kind: primary
routes:
  web: Web
steps:
  - text: While moving a note, the Owner chooses to create a notebook and names it
    kind: actor
    actor: owner
    entities:
      - { entity: notebook, effect: reads, facts: [Name] }
      - { entity: note, effect: reads, facts: [Title] }
    contexts:
      web:
        place: notes-web::note-editor
  - text: The Product checks that no other notebook of the Owner's has that name
    kind: product
    actor: owner
    entities:
      - { entity: notebook, effect: reads, facts: [Name] }
    contexts:
      web:
        place: notes-web::note-editor
  - text: The Product creates the empty notebook and returns the Owner to moving the note, with the new notebook chosen
    kind: product
    actor: owner
    entities:
      - { entity: note, effect: reads, facts: [] }
      - { entity: notebook, effect: creates, facts: [Name] }
    contexts:
      web:
        place: notes-web::note-editor
---

# Create a notebook while filing a note

## Trigger

The Owner is moving a note and none of their notebooks fits it.

## Outcome

An empty notebook with the chosen name exists, and moving the note continues
with it chosen.
