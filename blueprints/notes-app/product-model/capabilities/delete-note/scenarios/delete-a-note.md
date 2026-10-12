---
kind: primary
routes:
  web: Web
steps:
  - text: The Owner chooses to delete the open note
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
      - { entity: note, effect: removes, from: Filed }
    contexts:
      web:
        place: notes-web::note-editor
  - text: The Product removes any suggestion still proposed for it
    kind: product
    actor: owner
    entities:
      - { entity: suggestion, effect: removes, from: Proposed }
    contexts:
      web:
        place: notes-web::note-editor
  - text: The Owner is back in the notebook it was filed in, which no longer lists it
    kind: condition
    actor: owner
    entities:
      - { entity: notebook, effect: reads, facts: [Name] }
    contexts:
      web:
        place: notes-web::notebook
---

# Delete a note

## Trigger

The Owner decides a note is no longer worth keeping.

## Outcome

The note and any suggestion still waiting for it are gone, and the notebook it
was filed in no longer lists it.

## Edge cases

- The Owner declines to confirm → the note stays exactly as it was.
- Other notes link to the deleted note → their links to it stop leading anywhere and are shown as broken.
