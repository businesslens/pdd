---
kind: edge
routes:
  web: Web
steps:
  - text: The Developer asks for suggested details for the code in the editor
    kind: actor
    actor: developer
    entities: []
    contexts:
      web:
        place: snippets-web::workspace::snippet-editor
  - text: The Product asks a language model to draft a title, a description and tags for the code and its language, and keeps them as a suggestion
    kind: product
    actor: developer
    entities:
      - { entity: suggestion, effect: creates, to: Proposed, facts: [Suggested title, Suggested description, Suggested tags] }
    contexts:
      web:
        place: snippets-web::workspace::snippet-editor
  - text: The Product shows the suggestion beside the fields
    kind: product
    actor: developer
    entities:
      - { entity: suggestion, effect: reads, facts: [Suggested title, Suggested description, Suggested tags] }
    contexts:
      web:
        place: snippets-web::workspace::snippet-editor
  - text: The Developer dismisses the suggestion
    kind: actor
    actor: developer
    entities:
      - { entity: suggestion, effect: changes, from: Proposed, to: Dismissed, facts: [] }
    contexts:
      web:
        place: snippets-web::workspace::snippet-editor
  - text: The fields stay exactly as the Developer left them
    kind: condition
    actor: developer
    entities: []
    contexts:
      web:
        place: snippets-web::workspace::snippet-editor
---

# Dismiss suggested details

## Trigger

The Developer asks for suggested details and does not want what is proposed.

## Outcome

The suggestion is set aside and the editor holds only what the Developer wrote.
