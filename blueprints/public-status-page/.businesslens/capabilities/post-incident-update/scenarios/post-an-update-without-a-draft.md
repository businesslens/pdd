---
kind: primary
routes:
  web: Web
steps:
  - text: The Operator writes a message and chooses the incident status it announces
    kind: actor
    actor: operator
    entities:
      - { entity: incident, effect: reads, facts: [] }
    contexts:
      web:
        place: status-web::operator-console::incident-workspace
  - text: The Operator posts the update
    kind: actor
    actor: operator
    entities:
      - { entity: incident-update, effect: creates, facts: [Message, Incident status, Posted at] }
      - { entity: incident, from: Identified, to: Monitoring, facts: [] }
    contexts:
      web:
        place: status-web::operator-console::incident-workspace
  - text: The Product emails the incident update to every confirmed subscription
    kind: product
    actor: operator
    entities:
      - { entity: subscription, effect: reads, facts: [Email address] }
      - { entity: incident-update, effect: reads, facts: [Message] }
---

# Post an update without a draft

## Trigger

The Operator writes the next update themselves for an incident whose fix is now in place.

## Outcome

The update is on the public timeline, the incident shows Monitoring, and confirmed subscribers have been emailed.
