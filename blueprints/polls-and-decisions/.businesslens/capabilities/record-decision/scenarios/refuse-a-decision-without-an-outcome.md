---
kind: validation
routes:
  web: Web
steps:
  - text: The Member writes a rationale but leaves the outcome empty on the decision for a poll they own
    kind: actor
    actor: member
    entities:
      - { entity: poll, effect: reads, facts: [] }
      - { entity: decision, effect: reads, facts: [] }
    contexts:
      web:
        place: polls-web::decision
  - text: The Member records the decision
    kind: actor
    actor: member
    entities:
      - { entity: decision, effect: reads, facts: [] }
    contexts:
      web:
        place: polls-web::decision
  - text: The Product explains that a decision needs an outcome before it is recorded, and keeps the rationale as written
    kind: product
    actor: member
    entities:
      - { entity: decision, effect: reads, facts: [] }
    contexts:
      web:
        place: polls-web::decision
---

# Refuse a decision without an outcome

## Trigger

The poll's owner records a decision whose outcome is empty.

## Outcome

Nothing is recorded, the team sees no decision, and the owner keeps what they
wrote to complete.
