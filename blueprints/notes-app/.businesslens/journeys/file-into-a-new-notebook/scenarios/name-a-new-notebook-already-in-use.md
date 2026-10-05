---
kind: validation
result: not-achieved
routes:
  web: Web
steps:
  - text: The Owner chooses to move an unsorted note
    kind: actor
    actor: owner
    capability: move-note
    entities:
      - { entity: note, effect: reads, facts: [Title, Notebook] }
    contexts:
      web:
        place: notes-web::note-editor
  - text: The Owner chooses to create a notebook and gives it the name of one they already have
    kind: actor
    actor: owner
    capability: create-notebook
    entities:
      - { entity: notebook, effect: reads, facts: [Name] }
    contexts:
      web:
        place: notes-web::note-editor
  - text: The Product says the name is taken and creates no notebook
    kind: product
    actor: owner
    capability: create-notebook
    entities:
      - { entity: notebook, effect: reads, facts: [] }
    contexts:
      web:
        place: notes-web::note-editor
  - text: The note is still unsorted in the inbox
    kind: condition
    actor: owner
    entities:
      - { entity: note, effect: reads, facts: [Notebook] }
    contexts:
      web:
        place: notes-web::note-editor
---

# Name a new notebook already in use

## Trigger

The Owner, moving a note, tries to create a notebook under a name they already
use.

## Outcome

The Journey goal is not achieved: no notebook is created and the note stays in
the inbox. The Owner can change the name or pick the existing notebook.
