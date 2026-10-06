---
kind: primary
routes:
  web: Web
steps:
  - text: The Owner removes one tag from the open note's tags and saves the note
    kind: actor
    actor: owner
    entities:
      - { entity: note, effect: reads, facts: [Tags] }
      - { entity: tag, effect: reads, facts: [Name] }
    contexts:
      web:
        place: notes-web::note-editor
  - text: The Product keeps the note without the tag
    kind: product
    actor: owner
    entities:
      - { entity: note, facts: [Tags] }
      - { entity: tag, effect: reads, facts: [] }
    contexts:
      web:
        place: notes-web::note-editor
  - text: Other notes carrying the tag still carry it
    kind: condition
    actor: owner
    entities:
      - { entity: note, effect: reads, facts: [Tags] }
      - { entity: tag, effect: reads, facts: [] }
    contexts:
      web:
        place: notes-web::note-editor
---

# Take a tag off a note

## Trigger

The Owner decides a tag no longer describes a note.

## Outcome

The note no longer carries the tag, and every other note that carries it is
unchanged.
