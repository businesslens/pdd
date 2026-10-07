---
kind: validation
routes:
  web: Web
steps:
  - text: The Member posts a comment on a poll they opened earlier
    kind: actor
    actor: member
    entities:
      - { entity: poll, effect: reads, facts: [] }
      - { entity: comment, effect: reads, facts: [] }
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
  - text: The Product explains that the discussion closed with the poll, and keeps the Member's unposted text
    kind: product
    actor: member
    entities:
      - { entity: poll, effect: reads, facts: [Closed at] }
    contexts:
      web:
        place: polls-web::poll
---

# Refuse a comment on a closed poll

## Trigger

A Member posts a comment after the poll has closed.

## Outcome

Nothing is added to the discussion, the Member knows why, and their text is not
lost.
