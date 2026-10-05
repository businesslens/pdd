---
kind: primary
routes:
  web: Web
steps:
  - text: The Creator chooses to remove a question
    kind: actor
    actor: creator
    entities:
      - { entity: question, effect: reads, facts: [Prompt] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Product asks the Creator to confirm, and says that answers already received to it are kept
    kind: product
    actor: creator
    entities:
      - { entity: question, effect: reads, facts: [Prompt] }
      - { entity: response, effect: reads, facts: [] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Creator confirms
    kind: actor
    actor: creator
    entities:
      - { entity: question, effect: removes }
      - { entity: form, effect: changes, facts: [Question order] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: Responses already received keep the answers they gave to it
    kind: condition
    actor: creator
    entities:
      - { entity: response, effect: reads, facts: [Answers] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
---

# Remove a question

## Trigger

The Creator decides a question no longer belongs in the form.

## Outcome

The form no longer asks the question, and every answer already given to it remains in its response.

## Edge cases

- The Creator declines to confirm → the question stays and nothing changes.
