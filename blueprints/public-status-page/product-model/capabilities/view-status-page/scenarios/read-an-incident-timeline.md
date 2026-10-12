---
kind: primary
routes:
  web: Web
steps:
  - text: The Visitor opens an incident
    kind: actor
    actor: visitor
    entities:
      - { entity: incident, effect: reads, facts: [Title] }
    contexts:
      web:
        place: status-web::public-page::incident-detail
  - text: The Product shows what the incident affects and every posted incident update, newest first
    kind: product
    actor: visitor
    entities:
      - { entity: incident, effect: reads, facts: [Title, Impact, Affected components, Started at, Resolved at] }
      - { entity: incident-update, effect: reads, facts: [Message, Incident status, Posted at] }
    contexts:
      web:
        place: status-web::public-page::incident-detail
  - text: Drafts and their notes are not shown
    kind: condition
    actor: visitor
    entities:
      - { entity: incident-update, effect: reads, facts: [] }
    contexts:
      web:
        place: status-web::public-page::incident-detail
---

# Read an incident timeline

## Trigger

A Visitor wants the full story of one incident.

## Outcome

The Visitor reads every update the operators posted, in order, and nothing they have not posted.
