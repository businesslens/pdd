---
kind: primary
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Owner, editing a note, starts a link and types part of another note's title
    kind: actor
    actor: owner
    entities:
      - { entity: note, as: linking, effect: reads, facts: [Title, Body] }
    contexts:
      web:
        place: notes-web::note-editor
      mobile:
        place: notes-mobile::note-editor
  - text: The Product offers the notes whose titles match
    kind: product
    actor: owner
    entities:
      - { entity: note, as: linked, effect: reads, facts: [Title] }
    contexts:
      web:
        place: notes-web::note-editor
      mobile:
        place: notes-mobile::note-editor
  - text: The Owner picks one of them and saves
    kind: actor
    actor: owner
    entities: []
    contexts:
      web:
        place: notes-web::note-editor
      mobile:
        place: notes-mobile::note-editor
  - text: The Product keeps the link in the note being edited
    kind: product
    actor: owner
    entities:
      - { entity: note, as: linking, facts: [Body, Linked notes, Last edited] }
    contexts:
      web:
        place: notes-web::note-editor
      mobile:
        place: notes-mobile::note-editor
  - text: The linked note itself is unchanged
    kind: condition
    actor: owner
    entities:
      - { entity: note, as: linked, effect: reads, facts: [] }
    contexts:
      web:
        place: notes-web::note-editor
      mobile:
        place: notes-mobile::note-editor
---

# Link to another note

## Trigger

The Owner writes something that relates to a note they already have.

## Outcome

The note being edited links to the other note, which opens from the link, and
the other note is unchanged.

## Edge cases

- No title matches what the Owner typed → nothing is offered, and the typed words stay in the body as ordinary text.
