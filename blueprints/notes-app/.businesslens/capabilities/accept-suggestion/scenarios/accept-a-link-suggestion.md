---
kind: primary
routes:
  web: Web
steps:
  - text: The Owner reads a proposed suggestion to link a note to related notes
    kind: actor
    actor: owner
    entities:
      - { entity: suggestion, effect: reads, facts: [Suggested links, Reason, Suggested at] }
      - { entity: note, as: subject, effect: reads, facts: [Title, Body] }
      - { entity: note, as: related, effect: reads, facts: [Title] }
    contexts:
      web:
        place: notes-web::suggestions
  - text: The Owner accepts the suggestion
    kind: actor
    actor: owner
    entities:
      - { entity: suggestion, from: Proposed, to: Accepted, facts: [] }
    contexts:
      web:
        place: notes-web::suggestions
  - text: The Product adds the links to the end of the note's body
    kind: product
    actor: owner
    entities:
      - { entity: note, as: subject, facts: [Body, Linked notes, Last edited] }
    contexts:
      web:
        place: notes-web::suggestions
  - text: The related notes themselves are unchanged
    kind: condition
    actor: owner
    entities:
      - { entity: note, as: related, effect: reads, facts: [] }
    contexts:
      web:
        place: notes-web::suggestions
---

# Accept a link suggestion

## Trigger

The Owner agrees that a note should link to the related notes the AI agent
found.

## Outcome

The note links to each suggested note, where it is filed is unchanged, and the
suggestion is accepted.

## Edge cases

- A suggested related note was deleted after the suggestion was left → the links to the remaining notes are added.
