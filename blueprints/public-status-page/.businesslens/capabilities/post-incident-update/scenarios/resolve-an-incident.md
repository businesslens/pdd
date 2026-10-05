---
kind: edge
routes:
  web: Web
steps:
  - text: The Operator writes a final message and posts it as Resolved
    kind: actor
    actor: operator
    entities:
      - { entity: incident-update, effect: creates, to: Posted, facts: [Message, Incident status, Posted at] }
      - { entity: incident, from: Monitoring, to: Resolved, facts: [Resolved at] }
    contexts:
      web:
        place: status-web::operator-console::incident-workspace
  - text: The Product sets each affected component to the status that now applies
    kind: product
    actor: operator
    entities:
      - { entity: incident, effect: reads, facts: [Affected components] }
      - { entity: component, facts: [Status] }
    contexts:
      web:
        place: status-web::operator-console::incident-workspace
  - text: The Product emails the final incident update to every confirmed subscription
    kind: product
    actor: operator
    entities:
      - { entity: subscription, effect: reads, facts: [Email address] }
      - { entity: incident-update, effect: reads, facts: [Message] }
  - text: The incident leaves the current status page for the page's history
    kind: condition
    entities:
      - { entity: incident, effect: reads, facts: [] }
    contexts:
      web:
        place: status-web::operator-console::incident-workspace
---

# Resolve an incident

## Trigger

The Operator is confident the fix has held.

## Decision points

### Component status after resolution

Is a component also affected by another unresolved incident or maintenance in progress?

- No → it returns to Operational.
- Yes → it keeps the status that other incident or maintenance gives it.

## Outcome

The incident is resolved and in the page's history with its whole timeline, its components show the status that now applies, and confirmed subscribers have been told it is over.

## Edge cases

- The Operator posts a later follow-up on the resolved incident → it is added to the timeline and the incident stays resolved.
