---
kind: primary
routes:
  web: Web
steps:
  - text: The Visitor opens the page's history
    kind: actor
    actor: visitor
    entities: []
    contexts:
      web:
        place: status-web::public-page::history
  - text: The Product lists resolved incidents and completed maintenance, newest first
    kind: product
    actor: visitor
    entities:
      - { entity: incident, effect: reads, facts: [Title, Impact, Started at, Resolved at] }
      - { entity: maintenance, effect: reads, facts: [Title, Starts at, Ends at] }
    contexts:
      web:
        place: status-web::public-page::history
  - text: The Visitor opens a past incident to read its timeline
    kind: actor
    actor: visitor
    entities:
      - { entity: incident, effect: reads, facts: [Title] }
    contexts:
      web:
        place: status-web::public-page::incident-detail
---

# Browse past incidents

## Trigger

A Visitor wants to know how reliable the service has been.

## Outcome

The Visitor sees what went wrong before and when, and can read any past incident in full.
