---
kind: primary
routes:
  web: Web
steps:
  - text: The Owner reads a pending suggestion beside the note it is for
    kind: actor
    actor: owner
    entities:
      - { entity: suggestion, effect: reads, facts: [Suggested notebook, Suggested tags, Suggested links, Reason, Suggested at] }
      - { entity: note, effect: reads, facts: [Title, Body] }
    contexts:
      web:
        place: notes-web::suggestions
  - text: The Owner dismisses the suggestion
    kind: actor
    actor: owner
    entities:
      - { entity: suggestion, from: Pending, to: Dismissed, facts: [] }
    contexts:
      web:
        place: notes-web::suggestions
  - text: The note is exactly as it was, and the next pending suggestion is shown
    kind: condition
    actor: owner
    entities:
      - { entity: note, effect: reads, facts: [] }
      - { entity: suggestion, effect: reads, facts: [] }
    contexts:
      web:
        place: notes-web::suggestions
---

# Dismiss a suggestion

## Trigger

The Owner disagrees with a suggestion, or with part of it.

## Outcome

The suggestion is dismissed and no longer listed, and its note is unchanged.

## Edge cases

- The Owner chooses to file the note themselves → the suggestion is dismissed and moving the note begins at once.
