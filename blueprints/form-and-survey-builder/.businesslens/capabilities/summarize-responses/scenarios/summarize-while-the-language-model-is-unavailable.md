---
kind: edge
routes:
  web: Web
steps:
  - text: The Creator asks for a summary of the themes in a form's responses
    kind: actor
    actor: creator
    entities:
      - { entity: response, effect: reads, facts: [] }
      - { entity: form, effect: reads, facts: [Title] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The language model cannot be reached or returns nothing usable
    kind: condition
    entities: []
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Product says that no summary could be made
    kind: product
    actor: creator
    entities: []
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: Every response stays readable and exportable as it is
    kind: condition
    actor: creator
    entities:
      - { entity: response, effect: reads, facts: [Answers] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
---

# Summarize while the language model is unavailable

## Trigger

The Creator asks for a summary while the language model the Product calls is unavailable.

## Outcome

No summary is shown and the Creator knows why; reading and exporting the responses is unaffected.
