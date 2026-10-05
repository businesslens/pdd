---
kind: validation
routes:
  web: Web
steps:
  - text: The Operator posts a draft whose message is empty
    kind: actor
    actor: operator
    entities:
      - { entity: incident-update, effect: reads, facts: [Message] }
    contexts:
      web:
        place: status-web::operator-console::incident-workspace
  - text: The Product explains that an update needs a message
    kind: product
    actor: operator
    entities: []
    contexts:
      web:
        place: status-web::operator-console::incident-workspace
  - text: The draft stays a draft and no subscription is emailed
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

Nothing is posted or emailed, and the draft and its notes are kept.
