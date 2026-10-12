---
kind: validation
routes:
  web: Web
steps:
  - text: The Creator tries to show a question after an answer to a choice question asked after it
    kind: actor
    actor: creator
    entities:
      - { entity: entry-question, effect: reads, facts: [Prompt] }
      - { entity: choice-question, effect: reads, facts: [Prompt, Options] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Product explains that a show condition can name only an answer given earlier
    kind: product
    actor: creator
    entities: []
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The question's show condition is unchanged
    kind: condition
    actor: creator
    entities:
      - { entity: entry-question, effect: reads, facts: [Show condition] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
---

# Refuse a show condition on a later question

## Trigger

The Creator tries to make a question depend on one that comes later in the form.

## Outcome

The question keeps the show condition it had, and the Creator knows which questions it can depend on.
