---
kind: primary
routes:
  web: Web
steps:
  - text: The Owner chooses to delete a note that is still in the inbox
    kind: actor
    actor: owner
    entities:
      - { entity: note, effect: reads, facts: [Title] }
    contexts:
      web:
        place: notes-web::note-editor
  - text: The Product asks the Owner to confirm, and says the note cannot be recovered
    kind: product
    actor: owner
    entities:
      - { entity: note, effect: reads, facts: [Title] }
    contexts:
      web:
        place: notes-web::note-editor
  - text: The Owner confirms
    kind: actor
    actor: owner
    entities:
      - { entity: note, effect: removes, from: Unsorted }
    contexts:
      web:
        place: notes-web::note-editor
  - text: The Product removes any pending suggestions left for it
    kind: product
    actor: owner
    entities:
      - { entity: suggestion, effect: removes, from: Pending }
    contexts:
      web:
        place: notes-web::note-editor
  - text: The Owner is back in the inbox, which no longer lists it
    kind: condition
    actor: owner
    entities: []
    contexts:
      web:
        place: notes-web::inbox
---

# Delete an unsorted note

## Trigger

The Owner decides a note waiting in the inbox was not worth keeping.

## Outcome

The note and any suggestion still waiting for it are gone, and the inbox is one
note shorter without anything being filed.
