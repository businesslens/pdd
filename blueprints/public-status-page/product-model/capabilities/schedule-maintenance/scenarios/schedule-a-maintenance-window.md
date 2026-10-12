---
kind: primary
routes:
  web: Web
steps:
  - text: The Operator enters a title, a description, a start and end time, and the affected components
    kind: actor
    actor: operator
    entities:
      - { entity: component, effect: reads, facts: [Name] }
    contexts:
      web:
        place: status-web::operator-console::maintenance-list
  - text: The Product schedules the maintenance
    kind: product
    actor: operator
    entities:
      - { entity: maintenance, effect: creates, to: Scheduled, facts: [Title, Description, Starts at, Ends at, Affected components] }
    contexts:
      web:
        place: status-web::operator-console::maintenance-list
  - text: The Product emails the maintenance announcement to every confirmed subscription
    kind: product
    actor: operator
    entities:
      - { entity: subscription, effect: reads, facts: [Email address] }
      - { entity: maintenance, effect: reads, facts: [Title, Starts at, Ends at] }
  - text: The maintenance is listed as upcoming
    kind: condition
    entities:
      - { entity: maintenance, effect: reads, facts: [Title, Starts at, Ends at] }
    contexts:
      web:
        place: status-web::operator-console::maintenance-list
---

# Schedule a maintenance window

## Trigger

The Operator plans work visitors may notice.

## Outcome

The window is shown as upcoming on the public page and confirmed subscribers know when it will happen; no component changes until it starts.
