---
kind: validation
routes:
  web: Web
steps:
  - text: The Member casts a vote on a poll they opened earlier
    kind: actor
    actor: member
    entities:
      - { entity: poll, effect: reads, facts: [] }
      - { entity: vote, effect: reads, facts: [] }
    contexts:
      web:
        place: polls-web::poll
  - text: The poll has closed in the meantime
    kind: condition
    entities:
      - { entity: poll, effect: reads, facts: [Closed at] }
    contexts:
      web:
        place: polls-web::poll
  - text: The Product explains that voting on the poll has ended and counts nothing
    kind: product
    actor: member
    entities:
      - { entity: poll, effect: reads, facts: [Closed at] }
    contexts:
      web:
        place: polls-web::poll
---

# Refuse a vote on a closed poll

## Trigger

A Member casts a vote after the poll was closed by its owner or its deadline.

## Outcome

No vote is cast or changed, the final results are unaffected, and the Member
knows voting has ended.
