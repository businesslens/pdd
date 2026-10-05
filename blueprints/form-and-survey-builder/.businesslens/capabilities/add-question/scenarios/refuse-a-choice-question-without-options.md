---
kind: validation
routes:
  web: Web
steps:
  - text: The Creator chooses an answer type that offers options, lists none, and tries to add it
    kind: actor
    actor: creator
    entities: []
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Product explains that a choice needs at least one option
    kind: product
    actor: creator
    entities: []
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: Nothing is added to the form, and the prompt written so far is kept to finish
    kind: condition
    actor: creator
    entities:
      - { entity: form, effect: reads, facts: [Question order] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
---

# Refuse a choice question without options

## Trigger

The Creator tries to add a choice question before listing its options.

## Outcome

The form is unchanged, the Creator knows what is missing, and nothing they wrote is lost.
