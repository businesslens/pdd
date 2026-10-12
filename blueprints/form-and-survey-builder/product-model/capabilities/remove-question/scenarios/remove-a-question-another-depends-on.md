---
kind: edge
routes:
  web: Web
steps:
  - text: The Creator chooses to remove a choice question whose answer shows another question
    kind: actor
    actor: creator
    entities:
      - { entity: choice-question, effect: reads, facts: [Prompt] }
      - { entity: entry-question, effect: reads, facts: [Show condition] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Product asks the Creator to confirm, naming the dependent question and saying it will be shown to everyone answering once this one is gone
    kind: product
    actor: creator
    entities:
      - { entity: choice-question, effect: reads, facts: [Prompt] }
      - { entity: entry-question, effect: reads, facts: [Prompt, Show condition] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Creator confirms
    kind: actor
    actor: creator
    entities:
      - { entity: choice-question, effect: removes, from: Included }
      - { entity: entry-question, effect: changes, facts: [Show condition] }
      - { entity: form, effect: changes, facts: [Question order] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The dependent question is shown to everyone answering from now on
    kind: condition
    actor: creator
    entities:
      - { entity: entry-question, effect: reads, facts: [Show condition] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
---

# Remove a question another depends on

## Trigger

The Creator removes a choice question that another question's show condition names.

## Outcome

The question is gone, no question waits on an answer that can no longer be given, and answers already received are kept.

## Edge cases

- The Creator declines to confirm → both questions stay as they were.
