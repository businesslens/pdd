---
kind: primary
routes:
  web: Web
steps:
  - text: The Operator cancels the window and confirms
    kind: actor
    actor: operator
    entities:
      - { entity: maintenance, from: Scheduled, to: Cancelled, facts: [] }
    contexts:
      web:
        place: status-web::operator-console::maintenance-detail
  - text: The Product emails every confirmed subscription that the maintenance is cancelled
    kind: product
    actor: operator
    entities:
      - { entity: subscription, effect: reads, facts: [Email address] }
      - { entity: maintenance, effect: reads, facts: [Title] }
  - text: The maintenance is no longer shown as upcoming
    kind: condition
    entities:
      - { entity: maintenance, effect: reads, facts: [] }
    contexts:
      web:
        place: status-web::operator-console::maintenance-detail
---

# Cancel a scheduled window

## Trigger

The planned work is called off before it begins.

## Outcome

The window is cancelled, no component changes, and confirmed subscribers know it will not happen.

## Edge cases

- The window has already started → it cannot be cancelled; the Operator completes it instead.
- The Operator declines to confirm → the window stays scheduled.
