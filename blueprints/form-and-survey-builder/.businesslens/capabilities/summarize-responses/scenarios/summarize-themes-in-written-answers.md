---
kind: primary
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
  - text: The Product asks a language model to group the written answers into themes
    kind: product
    actor: creator
    entities:
      - { entity: response, effect: reads, facts: [Answers] }
      - { entity: entry-question, effect: reads, facts: [Prompt] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Product shows each theme, marked as a summary, with the responses it draws on
    kind: product
    actor: creator
    entities:
      - { entity: response, effect: reads, facts: [Answers] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: Every response is unchanged
    kind: condition
    actor: creator
    entities:
      - { entity: response, effect: reads, facts: [] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
---

# Summarize themes in written answers

## Trigger

The Creator has more written answers than they can read one by one.

## Outcome

The Creator sees the themes in the written answers and can open the responses behind each one; no response changed and the summary is not kept.
