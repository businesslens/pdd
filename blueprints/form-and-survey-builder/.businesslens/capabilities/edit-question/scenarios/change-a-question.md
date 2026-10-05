---
kind: primary
routes:
  web: Web
steps:
  - text: The Creator changes a question's prompt, its answer type or options, or whether an answer is required
    kind: actor
    actor: creator
    entities:
      - { entity: question, effect: changes, facts: [Prompt, Answer type, Required] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Product asks the changed question of anyone answering from now on
    kind: product
    actor: creator
    entities:
      - { entity: question, effect: reads, facts: [Prompt, Answer type, Required] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
---

# Change a question

## Trigger

The Creator wants a question to ask something differently.

## Outcome

The question reads as changed for anyone answering from now on.

## Edge cases

- The question already has answers → the responses that gave them keep those answers as given.
