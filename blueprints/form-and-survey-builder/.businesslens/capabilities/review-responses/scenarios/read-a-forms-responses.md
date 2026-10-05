---
kind: primary
routes:
  web: Web
steps:
  - text: The Creator opens the responses to a form
    kind: actor
    actor: creator
    entities:
      - { entity: response, effect: reads, facts: [] }
      - { entity: form, effect: reads, facts: [Title] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Product shows how many responses were received and the answers given to each question
    kind: product
    actor: creator
    entities:
      - { entity: response, effect: reads, facts: [Answers] }
      - { entity: question, effect: reads, facts: [Prompt] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Creator opens one response
    kind: actor
    actor: creator
    entities:
      - { entity: response, effect: reads, facts: [Submitted at] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Product shows every answer in it beside the question it answered, and when it was received
    kind: product
    actor: creator
    entities:
      - { entity: response, effect: reads, facts: [Answers, Submitted at] }
      - { entity: question, effect: reads, facts: [Prompt] }
    contexts:
      web:
        place: forms-web::form-workspace::response-detail
---

# Read a form's responses

## Trigger

The Creator wants to know what Respondents said.

## Outcome

The Creator has read the answers across all responses and one response in full; nothing about them changed.

## Edge cases

- No response has been received yet → the Product says so, and shows the public link while the form is open.
