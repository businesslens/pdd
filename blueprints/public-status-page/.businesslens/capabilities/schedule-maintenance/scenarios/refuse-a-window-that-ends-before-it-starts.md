---
kind: validation
routes:
  web: Web
steps:
  - text: The Operator schedules a window whose end is not after its start
    kind: actor
    actor: operator
    entities: []
    contexts:
      web:
        place: status-web::operator-console::maintenance-list
  - text: The Product explains that the window must end after it starts and keeps what was entered
    kind: product
    actor: operator
    entities: []
    contexts:
      web:
        place: status-web::operator-console::maintenance-list
  - text: No maintenance is scheduled
    kind: condition
    entities:
      - { entity: maintenance, effect: reads, facts: [] }
    contexts:
      web:
        place: status-web::operator-console::maintenance-list
---

# Refuse a window that ends before it starts

## Trigger

The Operator enters an end time at or before the start time.

## Outcome

Nothing is announced, and the Operator can correct the times without re-entering the rest.

## Edge cases

- The start time has already passed → the window is refused the same way.
