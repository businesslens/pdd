---
kind: primary
routes:
  web: Web
steps:
  - text: The Owner chooses to move the open note back to the inbox
    kind: actor
    actor: owner
    entities:
      - { entity: note, effect: reads, facts: [Title, Notebook] }
    contexts:
      web:
        place: notes-web::note-editor
  - text: The Product takes the note out of its notebook
    kind: product
    actor: owner
    entities:
      - { entity: note, from: Filed, to: Unsorted, facts: [Notebook] }
      - { entity: notebook, effect: reads, facts: [] }
    contexts:
      web:
        place: notes-web::note-editor
  - text: The note is listed in the inbox again
    kind: condition
    actor: owner
    entities:
      - { entity: note, effect: reads, facts: [Title, Created at] }
    contexts:
      web:
        place: notes-web::inbox
---

# Return a note to the inbox

## Trigger

The Owner wants to decide again where a filed note belongs.

## Outcome

The note is unsorted, in no notebook, and waiting in the inbox.
