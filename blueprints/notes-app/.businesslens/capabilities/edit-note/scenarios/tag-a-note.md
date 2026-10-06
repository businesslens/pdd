---
kind: primary
routes:
  web: Web
steps:
  - text: The Owner types part of a tag into the open note's tags
    kind: actor
    actor: owner
    entities:
      - { entity: note, effect: reads, facts: [Title, Tags] }
      - { entity: tag, effect: reads, facts: [] }
    contexts:
      web:
        place: notes-web::note-editor
  - text: The Product offers the Owner's tags that match
    kind: product
    actor: owner
    entities:
      - { entity: tag, effect: reads, facts: [Name] }
    contexts:
      web:
        place: notes-web::note-editor
  - text: The Owner picks one of them and saves the note
    kind: actor
    actor: owner
    entities:
      - { entity: note, effect: reads, facts: [] }

    contexts:
      web:
        place: notes-web::note-editor
  - text: The Product keeps the note with the tag on it
    kind: product
    actor: owner
    entities:
      - { entity: note, facts: [Tags] }
      - { entity: tag, effect: reads, facts: [] }
    contexts:
      web:
        place: notes-web::note-editor
---

# Tag a note

## Trigger

The Owner wants a note found with others that carry the same tag.

## Outcome

The note carries the tag, and appears when the Owner narrows a search to it.

## Edge cases

- The note already carries the tag → nothing changes.
