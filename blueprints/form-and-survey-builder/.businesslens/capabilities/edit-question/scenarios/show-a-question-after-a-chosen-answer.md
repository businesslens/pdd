---
kind: primary
routes:
  web: Web
steps:
  - text: The Creator picks an earlier choice question and one of its options as the answer that shows this question
    kind: actor
    actor: creator
    entities:
      - { entity: question, as: dependent, effect: changes, facts: [Show condition] }
      - { entity: question, as: earlier, effect: reads, facts: [Prompt, Answer type] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Product keeps the question hidden until that answer is given
    kind: product
    actor: creator
    entities:
      - { entity: question, as: dependent, effect: reads, facts: [Show condition] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
---

# Show a question after a chosen answer

## Trigger

The Creator wants a follow-up question asked only of people who gave a particular answer.

## Outcome

The question appears only to Respondents who give the chosen answer, and is required only when it appears.

## Edge cases

- The Creator clears the show condition → the question is shown to every Respondent again.
