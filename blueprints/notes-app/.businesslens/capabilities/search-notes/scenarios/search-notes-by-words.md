---
kind: primary
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Owner enters some words
    kind: actor
    actor: owner
    entities: []
    contexts:
      web:
        place: notes-web::search
      mobile:
        place: notes-mobile::search
  - text: The Product finds the notes whose title or body contains them, in the inbox and in every notebook
    kind: product
    actor: owner
    entities:
      - { entity: note, effect: reads, facts: [Title, Body, Notebook, Tags] }
      - { entity: notebook, effect: reads, facts: [] }
      - { entity: tag, effect: reads, facts: [] }
    contexts:
      web:
        place: notes-web::search
      mobile:
        place: notes-mobile::search
  - text: The Owner opens one of the notes found
    kind: actor
    actor: owner
    entities:
      - { entity: note, effect: reads, facts: [Title, Body, Notebook, Tags, Linked notes, Last edited] }
    contexts:
      web:
        place: notes-web::note-editor
      mobile:
        place: notes-mobile::note-editor
---

# Search notes by words

## Trigger

The Owner remembers something a note said but not where it is.

## Outcome

The note the Owner was looking for is open, found from a few words, and
nothing about any note has changed.

## Edge cases

- Nothing matches → the Owner is told no note contains those words, and the words stay to change.
