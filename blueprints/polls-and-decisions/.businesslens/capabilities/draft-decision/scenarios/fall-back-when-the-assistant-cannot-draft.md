---
kind: edge
routes:
  web: Web
steps:
  - text: The Member asks the Assistant to draft the decision for a closed poll they own
    kind: actor
    actor: member
    entities:
      - { entity: assistant, effect: reads, facts: [] }
      - { entity: poll, effect: reads, facts: [Closed at] }
      - { entity: decision, effect: reads, facts: [] }
    contexts:
      web:
        place: polls-web::poll
  - text: The Assistant cannot prepare a draft
    kind: condition
    actor: assistant
    entities: []
  - text: The Product tells the Member no draft was made and offers to start a blank decision instead
    kind: product
    actor: member
    entities:
      - { entity: decision, effect: reads, facts: [] }
    contexts:
      web:
        place: polls-web::poll
---

# Fall back when the Assistant cannot draft

## Trigger

The owner of a closed poll asks for a draft while the Assistant cannot provide
one.

## Outcome

No decision is created, the owner knows why, and they can still start a blank
decision for the poll.
