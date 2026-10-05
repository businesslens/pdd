---
kind: edge
routes:
  web: Web
steps:
  - text: The Member has already voted on a poll that is still open
    kind: condition
    actor: member
    entities:
      - { entity: poll, effect: reads, facts: [Closed at] }
      - { entity: vote, effect: reads, facts: [Chosen options] }
    contexts:
      web:
        place: polls-web::poll
  - text: The Member chooses differently and casts their vote again
    kind: actor
    actor: member
    entities:
      - { entity: vote, effect: changes, facts: [Chosen options, Cast at] }
    contexts:
      web:
        place: polls-web::poll
  - text: The Product counts the changed vote in place of the earlier one
    kind: product
    actor: member
    entities:
      - { entity: vote, effect: reads, facts: [Chosen options] }
    contexts:
      web:
        place: polls-web::poll
---

# Change a vote while the poll is open

## Trigger

A Member changes their mind before the poll closes.

## Outcome

The Member still holds exactly one vote on the poll, and it counts only toward
their new choice.
