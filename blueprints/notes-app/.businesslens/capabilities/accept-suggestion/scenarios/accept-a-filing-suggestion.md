---
kind: primary
routes:
  web: Web
steps:
  - text: The Owner reads a pending suggestion beside the note it is for
    kind: actor
    actor: owner
    entities:
      - { entity: suggestion, effect: reads, facts: [Suggested notebook, Suggested tags, Reason, Suggested at] }
      - { entity: note, effect: reads, facts: [Title, Body] }
    contexts:
      web:
        place: notes-web::suggestions
  - text: The Owner accepts the suggestion
    kind: actor
    actor: owner
    entities:
      - { entity: suggestion, from: Pending, to: Accepted, facts: [] }
    contexts:
      web:
        place: notes-web::suggestions
  - text: The Product creates any suggested tag that does not exist yet
    kind: product
    actor: owner
    entities:
      - { entity: tag, effect: creates, facts: [Name] }
    contexts:
      web:
        place: notes-web::suggestions
  - text: The Product files the note in the suggested notebook and puts the suggested tags on it
    kind: product
    actor: owner
    entities:
      - { entity: note, from: Unsorted, to: Filed, facts: [Notebook, Tags] }
      - { entity: notebook, effect: reads, facts: [] }
      - { entity: tag, effect: reads, facts: [] }
    contexts:
      web:
        place: notes-web::suggestions
  - text: The note has left the inbox, and the next pending suggestion is shown
    kind: condition
    actor: owner
    entities:
      - { entity: note, effect: reads, facts: [] }
      - { entity: suggestion, effect: reads, facts: [] }
    contexts:
      web:
        place: notes-web::suggestions
---

# Accept a filing suggestion

## Trigger

The Owner agrees with where the AI agent suggests an inbox note belongs.

## Outcome

The note is filed in the suggested notebook with the suggested tags, the
suggestion is accepted, and the inbox no longer lists the note.

## Decision points

### Does every suggested tag exist already?

Are all the tags the suggestion names already in use?

- Yes → the existing tags are put on the note and no tag is created.
- No → the missing tags are created first, then put on the note.

## Edge cases

- The Owner filed the note themselves after the suggestion was left → accepting moves it to the suggested notebook.
