---
kind: primary
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Owner opens a note
    kind: actor
    actor: owner
    entities:
      - { entity: note, effect: reads, facts: [Title, Body, Notebook, Tags, Linked notes, Last edited] }
    contexts:
      web:
        place: notes-web::note-editor
      mobile:
        place: notes-mobile::note-editor
  - text: The Owner changes the title or the body and saves
    kind: actor
    actor: owner
    entities: []
    contexts:
      web:
        place: notes-web::note-editor
      mobile:
        place: notes-mobile::note-editor
  - text: The Product keeps the changed note and when it was last edited
    kind: product
    actor: owner
    entities:
      - { entity: note, facts: [Title, Body, Last edited] }
    contexts:
      web:
        place: notes-web::note-editor
      mobile:
        place: notes-mobile::note-editor
  - text: The note keeps its notebook, tags and place in or out of the inbox
    kind: condition
    actor: owner
    entities:
      - { entity: note, effect: reads, facts: [Notebook, Tags] }
      - { entity: notebook, effect: reads, facts: [Name] }
      - { entity: tag, effect: reads, facts: [Name] }
    contexts:
      web:
        place: notes-web::note-editor
      mobile:
        place: notes-mobile::note-editor
---

# Edit a note

## Trigger

The Owner wants to add to or correct a note they already have.

## Outcome

The note says what the Owner wrote, and is still filed and tagged as it was.

## Edge cases

- The Owner removes the title → the note is titled by its first line again.
- The Owner leaves without saving → the note stays exactly as it was.
