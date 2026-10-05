---
kind: primary
routes:
  web: Web
steps:
  - text: The Creator moves a question to another position in the form
    kind: actor
    actor: creator
    entities:
      - { entity: form, effect: changes, facts: [Question order] }
      - { entity: question, effect: reads, facts: [Prompt] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Product asks the questions in the new order from now on
    kind: product
    actor: creator
    entities:
      - { entity: form, effect: reads, facts: [Question order] }
      - { entity: question, effect: reads, facts: [Prompt] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
---

# Move a question

## Trigger

The Creator wants a question asked earlier or later.

## Outcome

The form asks its questions in the new order; responses already received are unchanged.
