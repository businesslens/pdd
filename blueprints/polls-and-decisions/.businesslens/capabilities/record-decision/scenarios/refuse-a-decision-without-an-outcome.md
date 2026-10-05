---
kind: validation
routes:
  web: Web
steps:
  - text: The Member clears the outcome of a draft decision they own
    kind: actor
    actor: member
    entities:
      - { entity: decision, facts: [Outcome] }
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
  - text: The Product explains that a decision needs an outcome before it is recorded
    kind: product
    actor: member
    entities:
      - { entity: decision, effect: reads, facts: [] }
    contexts:
      web:
        place: polls-web::decision
  - text: The decision stays a draft with its rationale as written
    kind: condition
    actor: member
    entities:
      - { entity: decision, effect: reads, facts: [Rationale] }
    contexts:
      web:
        place: polls-web::decision
---

# Refuse a decision without an outcome

## Trigger

The poll's owner records a draft decision whose outcome is empty.

## Outcome

Nothing is recorded, the team sees no decision, and the owner keeps the draft
to complete.
