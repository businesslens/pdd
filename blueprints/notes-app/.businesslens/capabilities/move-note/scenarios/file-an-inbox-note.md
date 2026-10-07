---
kind: primary
routes:
  web: Web
steps:
  - text: The Owner chooses to move an unsorted note from the inbox
    kind: actor
    actor: owner
    entities:
      - { entity: note, effect: reads, facts: [Title] }
    contexts:
      web:
        place: notes-web::inbox
  - text: The Owner picks one of their notebooks
    kind: actor
    actor: owner
    entities:
      - { entity: notebook, effect: reads, facts: [Name] }
    contexts:
      web:
        place: notes-web::inbox
  - text: The Product files the note in that notebook
    kind: product
    actor: owner
    entities:
      - { entity: note, from: Unsorted, to: Filed, facts: [Notebook] }
      - { entity: notebook, effect: reads, facts: [] }
    contexts:
      web:
        place: notes-web::inbox
  - text: The note has left the inbox, and its words and tags are unchanged
    kind: condition
    actor: owner
    entities:
      - { entity: note, effect: reads, facts: [] }
      - { entity: tag, effect: reads, facts: [] }
    contexts:
      web:
        place: notes-web::inbox
---

# File an inbox note

## Trigger

The Owner knows where a note waiting in the inbox belongs.

## Outcome

The note is filed in the chosen notebook and the inbox no longer lists it.

## Edge cases

- The Owner has no notebook yet → the only choice offered is to create one, which continues the filing.
