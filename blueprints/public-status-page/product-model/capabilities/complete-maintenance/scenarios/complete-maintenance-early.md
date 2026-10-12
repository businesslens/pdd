---
kind: edge
routes:
  web: Web
steps:
  - text: The Operator completes the maintenance before its planned end
    kind: actor
    actor: operator
    entities:
      - { entity: maintenance, from: In progress, to: Completed, facts: [Ends at] }
    contexts:
      web:
        place: status-web::operator-console::maintenance-detail
  - text: The Product returns the affected components to service
    kind: product
    actor: operator
    entities:
      - { entity: maintenance, effect: reads, facts: [Affected components] }
      - { entity: component, facts: [Status] }
    contexts:
      web:
        place: status-web::operator-console::maintenance-detail
  - text: The Product emails every confirmed subscription that the maintenance is complete
    kind: product
    actor: operator
    entities:
      - { entity: subscription, effect: reads, facts: [Email address] }
      - { entity: maintenance, effect: reads, facts: [Title] }
---

# Complete maintenance early

## Trigger

The work finishes before the window's planned end.

## Decision points

### Component status after maintenance

Is a component also affected by an unresolved incident?

- No → it returns to Operational.
- Yes → it shows the status that incident gives it.

## Outcome

The window is completed with its actual end time, its components show the status that now applies, and confirmed subscribers have been told.
