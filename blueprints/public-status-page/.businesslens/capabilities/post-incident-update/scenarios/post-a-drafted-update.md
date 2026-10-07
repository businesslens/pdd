---
kind: primary
routes:
  web: Web
steps:
  - text: The Operator reads the drafted message and chooses the incident status it announces
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
      - { entity: incident-update, effect: creates, facts: [Message, Notes, Incident status, Posted at] }
      - { entity: incident, from: Investigating, to: Identified, facts: [] }
    contexts:
      web:
        place: status-web::operator-console::incident-workspace
  - text: The Product adds the incident update to the incident's public timeline
    kind: product
    actor: operator
    entities:
      - { entity: incident-update, effect: reads, facts: [Message, Posted at] }
      - { entity: incident, effect: reads, facts: [] }
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

# Post a drafted update

## Trigger

The Operator is satisfied with a drafted message for an incident still being investigated.

## Outcome

The update is on the public timeline with the notes it was drafted from kept for the team, the incident shows Identified, and confirmed subscribers have been emailed the message the Operator approved.
