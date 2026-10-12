---
kind: primary
routes:
  web: Web
steps:
  - text: A maintenance window in progress reaches its planned end
    kind: condition
    unattended: true
    entities:
      - { entity: maintenance, effect: reads, facts: [Ends at] }
  - text: The Product completes the maintenance
    kind: product
    entities:
      - { entity: maintenance, from: In progress, to: Completed, facts: [] }
  - text: The Product returns the affected components to service
    kind: product
    entities:
      - { entity: maintenance, effect: reads, facts: [Affected components] }
      - { entity: component, facts: [Status] }
  - text: The Product emails every confirmed subscription that the maintenance is complete
    kind: product
    entities:
      - { entity: subscription, effect: reads, facts: [Email address] }
      - { entity: maintenance, effect: reads, facts: [Title] }
  - text: The maintenance is in the page's history
    kind: product
    entities:
      - { entity: maintenance, effect: reads, facts: [Title, Starts at, Ends at] }
    contexts:
      web:
        place: status-web::public-page::history
---

# Complete maintenance on schedule

## Trigger

The planned end of a maintenance window in progress arrives, with no Operator present.

## Decision points

### Component status after maintenance

Is a component also affected by an unresolved incident?

- No → it returns to Operational.
- Yes → it shows the status that incident gives it.

## Outcome

The window is completed and in the page's history, its components show the status that now applies, and confirmed subscribers have been told.
