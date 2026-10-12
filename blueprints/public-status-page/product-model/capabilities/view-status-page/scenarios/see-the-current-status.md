---
kind: primary
routes:
  web: Web
steps:
  - text: The Visitor opens the status page
    kind: actor
    actor: visitor
    entities: []
    contexts:
      web:
        place: status-web::public-page::current-status
  - text: The Product shows the overall status and every component with its status
    kind: product
    actor: visitor
    entities:
      - { entity: component, effect: reads, facts: [Name, Description, Status] }
    contexts:
      web:
        place: status-web::public-page::current-status
  - text: The Product shows each unresolved incident with its latest incident update
    kind: product
    actor: visitor
    entities:
      - { entity: incident, effect: reads, facts: [Title, Impact] }
      - { entity: incident-update, effect: reads, facts: [Message, Posted at] }
    contexts:
      web:
        place: status-web::public-page::current-status
  - text: The Product shows maintenance in progress or coming up
    kind: product
    actor: visitor
    entities:
      - { entity: maintenance, effect: reads, facts: [Title, Starts at, Ends at] }
    contexts:
      web:
        place: status-web::public-page::current-status
---

# See the current status

## Trigger

A Visitor wants to know whether the service is working.

## Outcome

The Visitor sees the overall status, which components are affected, what the operators have said about it, and what maintenance is planned.
