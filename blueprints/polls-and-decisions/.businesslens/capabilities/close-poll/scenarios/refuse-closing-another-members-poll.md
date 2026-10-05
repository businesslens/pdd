---
kind: validation
routes:
  web: Web
steps:
  - text: The Member attempts to close an open poll another Member owns
    kind: actor
    actor: member
    entities:
      - { entity: poll, effect: reads, facts: [] }
    contexts:
      web:
        place: polls-web::poll
  - text: The Product checks who owns the poll
    kind: product
    actor: member
    entities:
      - { entity: poll, effect: reads, facts: [] }
    contexts:
      web:
        place: polls-web::poll
  - text: The attempt is refused and the poll stays open
    kind: condition
    entities:
      - { entity: poll, effect: reads, facts: [Closed at] }
    contexts:
      web:
        place: polls-web::poll
---

# Refuse closing another Member's poll

## Trigger

A Member who does not own an open poll tries to close it.

## Outcome

The poll stays open for everyone, and the Member gains no control over it.
