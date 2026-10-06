---
kind: primary
routes:
  web: Web
steps:
  - text: The Operator starts a new declaration from the list of incidents
    kind: actor
    actor: operator
    entities:
      - { entity: incident, effect: reads, facts: [] }
    contexts:
      web:
        place: status-web::operator-console::incident-list
  - text: The Operator enters a title, an impact, the affected components with the status each should show, and a first message
    kind: actor
    actor: operator
    entities:
      - { entity: component, effect: reads, facts: [Name, Status] }
    contexts:
      web:
        place: status-web::operator-console::new-incident
  - text: The Operator submits the declaration
    kind: actor
    actor: operator
    entities: []
    contexts:
      web:
        place: status-web::operator-console::new-incident
  - text: The Product opens the incident as Investigating and posts its first incident update
    kind: product
    actor: operator
    entities:
      - { entity: incident, effect: creates, to: Investigating, facts: [Title, Impact, Affected components, Started at] }
      - { entity: incident-update, effect: creates, facts: [Message, Incident status, Posted at] }
    contexts:
      web:
        place: status-web::operator-console::new-incident
  - text: The Product sets each affected component to the status the Operator chose
    kind: product
    actor: operator
    entities:
      - { entity: component, facts: [Status] }
    contexts:
      web:
        place: status-web::operator-console::new-incident
  - text: The Product emails the first incident update to every confirmed subscription
    kind: product
    actor: operator
    entities:
      - { entity: subscription, effect: reads, facts: [Email address] }
      - { entity: incident-update, effect: reads, facts: [Message] }
  - text: The Product opens the incident's workspace
    kind: product
    actor: operator
    entities:
      - { entity: incident, effect: reads, facts: [Title] }
    contexts:
      web:
        place: status-web::operator-console::incident-workspace
---

# Declare an incident

## Trigger

The Operator learns of a problem visitors may notice.

## Outcome

The incident is on the current status page with its first update, its components show the chosen statuses, confirmed subscribers have been emailed, and the Operator is in the incident's workspace ready to post the next update.

## Edge cases

- No component is chosen → the incident is declared and shown without changing any component's status.
