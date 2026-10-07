---
kind: primary
routes:
  web: Web
steps:
  - text: The Creator changes a choice question's prompt, its options, whether one option or several may be picked, or whether an answer is required
    kind: actor
    actor: creator
    entities:
      - { entity: choice-question, effect: changes, facts: [Prompt, Selection, Options, Required] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Product asks the changed question of anyone answering from now on
    kind: product
    actor: creator
    entities:
      - { entity: choice-question, effect: reads, facts: [Prompt, Selection, Options, Required] }
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

- The question is an entry question → its prompt, its answer type among a short answer, a paragraph, a rating and a date, and whether it is required change the same way.
- The question already has answers → the responses that gave them keep those answers as given.
