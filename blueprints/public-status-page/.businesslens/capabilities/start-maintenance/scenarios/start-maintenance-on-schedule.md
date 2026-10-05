---
kind: primary
routes:
  web: Web
steps:
  - text: A scheduled maintenance window reaches its start time
    kind: condition
    unattended: true
    entities:
      - { entity: maintenance, effect: reads, facts: [Starts at] }
  - text: The Product starts the maintenance
    kind: product
    entities:
      - { entity: maintenance, from: Scheduled, to: In progress, facts: [] }
  - text: The Product shows each affected component as Under maintenance
    kind: product
    entities:
      - { entity: maintenance, effect: reads, facts: [Affected components] }
      - { entity: component, facts: [Status] }
  - text: The Product emails every confirmed subscription that the maintenance has started
    kind: product
    entities:
      - { entity: subscription, effect: reads, facts: [Email address] }
      - { entity: maintenance, effect: reads, facts: [Title] }
  - text: The public page shows the maintenance in progress
    kind: product
    entities:
      - { entity: maintenance, effect: reads, facts: [Title, Starts at, Ends at] }
      - { entity: component, effect: reads, facts: [Status] }
    contexts:
      web:
        place: status-web::public-page::current-status
---

# Start maintenance on schedule

## Trigger

The start time of a scheduled maintenance window arrives, with no Operator present.

## Outcome

The window is in progress, its components show Under maintenance, and confirmed subscribers have been told it has started.
