---
kind: primary
routes:
  web: Web
steps:
  - text: The Owner chooses to move the open note, which is filed in a notebook
    kind: actor
    actor: owner
    entities:
      - { entity: note, effect: reads, facts: [Title, Notebook] }
      - { entity: notebook, as: current, effect: reads, facts: [Name] }
    contexts:
      web:
        place: notes-web::note-editor
  - text: The Owner picks a different notebook
    kind: actor
    actor: owner
    entities:
      - { entity: notebook, as: chosen, effect: reads, facts: [Name] }
    contexts:
      web:
        place: notes-web::note-editor
  - text: The Product files the note in the chosen notebook instead
    kind: product
    actor: owner
    entities:
      - { entity: note, facts: [Notebook] }
      - { entity: notebook, as: chosen, effect: reads, facts: [] }
    contexts:
      web:
        place: notes-web::note-editor
  - text: The notebook it left no longer lists it
    kind: condition
    actor: owner
    entities:
      - { entity: notebook, as: current, effect: reads, facts: [] }
    contexts:
      web:
        place: notes-web::note-editor
---

# Move a note to another notebook

## Trigger

The Owner decides a filed note belongs in a different notebook.

## Outcome

The note is filed in the chosen notebook and in no other, with its words and
tags unchanged.
