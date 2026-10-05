---
kind: primary
routes:
  web: Web
steps:
  - text: The Creator chooses to publish a draft form
    kind: actor
    actor: creator
    entities:
      - { entity: form, effect: reads, facts: [Title] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Product checks that the form has at least one question
    kind: product
    actor: creator
    entities:
      - { entity: form, effect: reads, facts: [Question order] }
      - { entity: question, effect: reads, facts: [] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Creator confirms publication
    kind: actor
    actor: creator
    entities:
      - { entity: form, effect: changes, from: Draft, to: Open, facts: [Public link] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Product shows the public link to share
    kind: product
    actor: creator
    entities:
      - { entity: form, effect: reads, facts: [Public link] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
---

# Publish a draft form

## Trigger

The Creator has the questions they want and is ready for answers.

## Outcome

The form is open and anyone holding its public link can respond.
