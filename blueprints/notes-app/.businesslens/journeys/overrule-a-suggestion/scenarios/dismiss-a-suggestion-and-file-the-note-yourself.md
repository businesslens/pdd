---
kind: primary
result: achieved
routes:
  web: Web
steps:
  - text: The Owner reads a proposed filing suggestion beside the note it is for
    kind: actor
    actor: owner
    capability: dismiss-suggestion
    entities:
      - { entity: suggestion, effect: reads, facts: [Suggested notebook, Reason] }
      - { entity: note, effect: reads, facts: [Title] }
    contexts:
      web:
        place: notes-web::suggestions
  - text: The Owner chooses to dismiss it and file the note themselves
    kind: actor
    actor: owner
    capability: dismiss-suggestion
    entities:
      - { entity: note, effect: reads, facts: [] }
      - { entity: suggestion, from: Proposed, to: Dismissed, facts: [] }
    contexts:
      web:
        place: notes-web::suggestions
  - text: The Product takes the Owner to the note, with moving it already open
    kind: product
    actor: owner
    capability: dismiss-suggestion
    entities:
      - { entity: note, effect: reads, facts: [Title, Notebook] }
    contexts:
      web:
        place: notes-web::note-editor
  - text: The Owner picks one of their notebooks
    kind: actor
    actor: owner
    capability: move-note
    entities:
      - { entity: notebook, effect: reads, facts: [Name] }
    contexts:
      web:
        place: notes-web::note-editor
  - text: The Product files the note in the chosen notebook
    kind: product
    actor: owner
    capability: move-note
    entities:
      - { entity: note, from: Unsorted, to: Filed, facts: [Notebook] }
      - { entity: notebook, effect: reads, facts: [] }
    contexts:
      web:
        place: notes-web::note-editor
---

# Dismiss a suggestion and file the note yourself

## Trigger

The Owner reads a suggestion to file an inbox note somewhere they think is
wrong.

## Outcome

The Journey goal is achieved: the suggestion is dismissed, and the note has
left the inbox for the notebook the Owner picked.
