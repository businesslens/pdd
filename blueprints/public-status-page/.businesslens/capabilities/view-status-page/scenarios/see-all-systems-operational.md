---
kind: edge
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
  - text: Every component is Operational and no incident is unresolved
    kind: condition
    entities:
      - { entity: component, effect: reads, facts: [Status] }
      - { entity: incident, effect: reads, facts: [] }
    contexts:
      web:
        place: status-web::public-page::current-status
  - text: The Product says all systems are operational and lists the components
    kind: product
    actor: visitor
    entities:
      - { entity: component, effect: reads, facts: [Name, Status] }
    contexts:
      web:
        place: status-web::public-page::current-status
---

# See all systems operational

## Trigger

A Visitor opens the page while nothing is wrong.

## Outcome

The Visitor sees plainly that everything is working, with no incident shown.
