---
kind: primary
routes:
  web: Web
steps:
  - text: The Owner types a word no tag has into the open note's tags and adds it
    kind: actor
    actor: owner
    entities:
      - { entity: note, effect: reads, facts: [Title, Tags] }
      - { entity: tag, effect: reads, facts: [Name] }
    contexts:
      web:
        place: notes-web::note-editor
  - text: The Product creates the tag and puts it on the note
    kind: product
    actor: owner
    entities:
      - { entity: tag, effect: creates, facts: [Name] }
      - { entity: note, facts: [Tags] }
    contexts:
      web:
        place: notes-web::note-editor
---

# Tag a note with a new tag

## Trigger

The Owner wants to group a note under a word they have not used as a tag
before.

## Outcome

A new tag exists, the note carries it, and it is offered the next time the
Owner tags any note.
