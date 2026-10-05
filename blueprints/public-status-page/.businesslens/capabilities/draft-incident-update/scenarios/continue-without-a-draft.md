---
kind: failure
routes:
  web: Web
steps:
  - text: The Operator writes rough notes and asks for a draft
    kind: actor
    actor: operator
    entities:
      - { entity: incident, effect: reads, facts: [] }
    contexts:
      web:
        place: status-web::operator-console::incident-workspace
  - text: No draft can be prepared
    kind: condition
    entities: []
    contexts:
      web:
        place: status-web::operator-console::incident-workspace
  - text: The Product says no draft could be prepared and keeps the Operator's notes
    kind: product
    actor: operator
    entities: []
    contexts:
      web:
        place: status-web::operator-console::incident-workspace
  - text: No incident update is created
    kind: condition
    actor: operator
    entities:
      - { entity: incident-update, effect: reads, facts: [] }
    contexts:
      web:
        place: status-web::operator-console::incident-workspace
---

# Continue without a draft

## Trigger

The Operator asks for a draft while the Drafting assistant cannot prepare one.

## Outcome

The Operator still has their notes and can write and post the update themselves; nothing was published.
