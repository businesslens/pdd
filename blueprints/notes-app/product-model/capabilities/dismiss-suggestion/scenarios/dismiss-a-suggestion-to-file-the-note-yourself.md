---
kind: primary
routes:
  web: Web
steps:
  - text: The Owner reads a proposed filing suggestion beside the note it is for
    kind: actor
    actor: owner
    entities:
      - { entity: suggestion, effect: reads, facts: [Suggested notebook, Suggested tags, Reason, Suggested at] }
      - { entity: note, effect: reads, facts: [Title, Body] }
    contexts:
      web:
        place: notes-web::suggestions
  - text: The Owner chooses to dismiss it and file the note themselves
    kind: actor
    actor: owner
    entities:
      - { entity: note, effect: reads, facts: [] }
      - { entity: suggestion, from: Proposed, to: Dismissed, facts: [] }
    contexts:
      web:
        place: notes-web::suggestions
  - text: The Product takes the Owner to the note, with moving it already open
    kind: product
    actor: owner
    entities:
      - { entity: note, effect: reads, facts: [Title, Notebook] }
    contexts:
      web:
        place: notes-web::note-editor
---

# Dismiss a suggestion to file the note yourself

## Trigger

The Owner disagrees with where the AI agent suggests a note belongs, and knows
where it does belong.

## Outcome

The suggestion is dismissed, the note is unchanged, and the Owner is at the
note with moving it open, to pick its notebook themselves.
