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
  - text: No response holds a written answer yet
    kind: condition
    actor: creator
    entities:
      - { entity: response, effect: reads, facts: [Answers] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Product says there is nothing to summarize yet
    kind: product
    actor: creator
    entities: []
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
---

# Summarize a form without written answers

## Trigger

The Creator asks for a summary before any written answer has arrived.

## Outcome

No summary is shown and the Creator knows why.
