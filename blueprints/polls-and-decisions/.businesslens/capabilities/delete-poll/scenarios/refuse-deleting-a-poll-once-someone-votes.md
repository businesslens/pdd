---
kind: validation
routes:
  web: Web
steps:
  - text: The Member confirms deleting an open poll they own
    kind: actor
    actor: member
    entities:
      - { entity: poll, effect: reads, facts: [] }
    contexts:
      web:
        place: polls-web::poll
  - text: A vote has been cast on it in the meantime
    kind: condition
    entities:
      - { entity: poll, effect: reads, facts: [Votes cast] }
      - { entity: vote, effect: reads, facts: [] }
    contexts:
      web:
        place: polls-web::poll
  - text: The Product explains that a poll someone has voted on can no longer be deleted, and keeps it as it was
    kind: product
    actor: member
    entities:
      - { entity: poll, effect: reads, facts: [Votes cast] }
    contexts:
      web:
        place: polls-web::poll
---

# Refuse deleting a poll once someone votes

## Trigger

The owner confirms deleting a poll after its first vote has arrived.

## Outcome

Nothing is deleted, the vote and the comments stand, and the owner knows why.
They can still close the poll.
