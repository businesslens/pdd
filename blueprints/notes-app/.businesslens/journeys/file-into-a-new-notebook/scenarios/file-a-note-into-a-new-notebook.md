---
kind: primary
result: achieved
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
  - text: Finding no notebook that fits, the Owner chooses to create one and names it
    kind: actor
    actor: owner
    capability: create-notebook
    entities:
      - { entity: notebook, effect: reads, facts: [Name] }
    contexts:
      web:
        place: notes-web::note-editor
  - text: The Product creates the empty notebook
    kind: product
    actor: owner
    capability: create-notebook
    entities:
      - { entity: notebook, effect: creates, facts: [Name] }
    contexts:
      web:
        place: notes-web::note-editor
  - text: The Product files the note in the new notebook without asking again
    kind: product
    actor: owner
    capability: move-note
    entities:
      - { entity: note, from: Unsorted, to: Filed, facts: [Notebook] }
      - { entity: notebook, effect: reads, facts: [] }
    contexts:
      web:
        place: notes-web::note-editor
---

# File a note into a new notebook

## Trigger

The Owner is moving a note out of the inbox and none of their notebooks fits
it.

## Outcome

The Journey goal is achieved: the new notebook exists and holds the note, which
has left the inbox.
