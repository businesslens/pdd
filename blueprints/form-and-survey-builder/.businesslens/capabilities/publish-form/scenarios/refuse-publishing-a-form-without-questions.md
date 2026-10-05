---
kind: validation
routes:
  web: Web
steps:
  - text: The Creator chooses to publish a draft form that is still empty
    kind: actor
    actor: creator
    entities:
      - { entity: form, effect: reads, facts: [Question order] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Product explains that an empty form cannot be published
    kind: product
    actor: creator
    entities:
      - { entity: form, effect: reads, facts: [Question order] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The form stays a draft with no public link
    kind: condition
    actor: creator
    entities:
      - { entity: form, effect: reads, facts: [] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
---

# Refuse publishing a form without questions

## Trigger

The Creator tries to publish a form before adding a question.

## Outcome

Nothing is published, and the Creator knows a question is needed first.
