---
kind: edge
result: not-achieved
routes:
  web: Web
steps:
  - text: The Owner chooses to dismiss a suggestion and file the note themselves
    kind: actor
    actor: owner
    capability: dismiss-suggestion
    entities:
      - { entity: suggestion, from: Proposed, to: Dismissed, facts: [] }
      - { entity: note, effect: reads, facts: [Title] }
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
  - text: The Owner leaves without choosing where it goes
    kind: actor
    actor: owner
    entities: []
    contexts:
      web:
        place: notes-web::note-editor
  - text: The note is still unsorted in the inbox, and its suggestion stays dismissed
    kind: condition
    actor: owner
    entities:
      - { entity: note, effect: reads, facts: [Notebook] }
      - { entity: suggestion, effect: reads, facts: [] }
    contexts:
      web:
        place: notes-web::inbox
---

# Dismiss a suggestion and leave the note unsorted

## Trigger

The Owner turns down a suggestion intending to file the note themselves, then
leaves without choosing where it goes.

## Outcome

The Journey goal is not achieved: the note is unchanged and still in the
inbox, and the AI agent may suggest for it again.
