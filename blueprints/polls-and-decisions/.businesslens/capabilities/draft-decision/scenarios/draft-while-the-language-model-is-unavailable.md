---
kind: edge
routes:
  web: Web
steps:
  - text: The Member asks for a generated draft of the decision for a closed poll they own
    kind: actor
    actor: member
    entities:
      - { entity: poll, effect: reads, facts: [Closed at] }
      - { entity: decision, effect: reads, facts: [] }
    contexts:
      web:
        place: polls-web::poll
  - text: The language model cannot be reached or returns nothing usable
    kind: condition
    entities: []
  - text: The Product tells the Member no draft was made and offers to write the decision themselves
    kind: product
    actor: member
    entities:
      - { entity: decision, effect: reads, facts: [] }
    contexts:
      web:
        place: polls-web::poll
---

# Draft while the language model is unavailable

## Trigger

The owner of a closed poll asks for a generated draft while the language model
the Product calls is unavailable.

## Outcome

No draft is made, the owner knows why, and they can still write the decision
themselves.
