---
kind: validation
routes:
  web: Web
steps:
  - text: The Operator submits a declaration with no title or no first message
    kind: actor
    actor: operator
    entities: []
    contexts:
      web:
        place: status-web::operator-console::new-incident
  - text: The Product explains what is missing and keeps everything entered
    kind: product
    actor: operator
    entities: []
    contexts:
      web:
        place: status-web::operator-console::new-incident
  - text: No incident is opened, no component changes and no subscription is emailed
    kind: condition
    entities:
      - { entity: incident, effect: reads, facts: [] }
      - { entity: component, effect: reads, facts: [] }
      - { entity: subscription, effect: reads, facts: [] }
    contexts:
      web:
        place: status-web::operator-console::new-incident
---

# Refuse an incident without a first message

## Trigger

The Operator declares an incident without a title or without a first message for visitors.

## Outcome

Nothing is published; the Operator completes the missing part and declares again.
