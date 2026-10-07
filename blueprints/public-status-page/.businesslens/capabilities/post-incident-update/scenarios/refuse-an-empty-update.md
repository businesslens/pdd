---
kind: validation
routes:
  web: Web
steps:
  - text: The Operator posts an update whose message is empty
    kind: actor
    actor: operator
    entities: []
    contexts:
      web:
        place: status-web::operator-console::incident-workspace
  - text: The Product explains that an update needs a message and keeps the notes
    kind: product
    actor: operator
    entities: []
    contexts:
      web:
        place: status-web::operator-console::incident-workspace
  - text: No incident update is posted and no subscription is emailed
    kind: condition
    actor: operator
    entities:
      - { entity: incident-update, effect: reads, facts: [] }
      - { entity: subscription, effect: reads, facts: [] }
    contexts:
      web:
        place: status-web::operator-console::incident-workspace
---

# Refuse an empty update

## Trigger

The Operator posts an update with no message.

## Outcome

Nothing is posted or emailed, and the notes are kept.
