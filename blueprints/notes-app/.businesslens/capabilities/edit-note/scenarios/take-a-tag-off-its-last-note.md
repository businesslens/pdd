---
kind: edge
routes:
  web: Web
steps:
  - text: The Owner removes a tag from the only note that carries it and saves the note
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
  - text: No note carries the tag any more, so the Product ends it
    kind: product
    actor: owner
    entities:
      - { entity: note, effect: reads, facts: [] }
      - { entity: tag, effect: removes }
    contexts:
      web:
        place: notes-web::note-editor
---

# Take a tag off its last note

## Trigger

The Owner takes a tag off the last note that still carries it.

## Outcome

The note no longer carries the tag, and the tag is no longer offered when
tagging or searching.
