---
kind: edge
routes:
  web: Web
steps:
  - text: The Creator chooses to remove a question whose answer shows another question
    kind: actor
    actor: creator
    entities:
      - { entity: question, as: removed, effect: reads, facts: [Prompt] }
      - { entity: question, as: dependent, effect: reads, facts: [Show condition] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Product names the dependent question and says it will be shown to everyone answering once this one is gone
    kind: product
    actor: creator
    entities:
      - { entity: question, as: removed, effect: reads, facts: [Prompt] }
      - { entity: question, as: dependent, effect: reads, facts: [Prompt, Show condition] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Creator confirms
    kind: actor
    actor: creator
    entities:
      - { entity: question, as: removed, effect: removes }
      - { entity: question, as: dependent, effect: changes, facts: [Show condition] }
      - { entity: form, effect: changes, facts: [Question order] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The dependent question is shown to everyone answering from now on
    kind: condition
    actor: creator
    entities:
      - { entity: question, as: dependent, effect: reads, facts: [Show condition] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
---

# Remove a question another depends on

## Trigger

The Creator removes a question that another question's show condition names.

## Outcome

The question is gone, no question waits on an answer that can no longer be given, and answers already received are kept.
