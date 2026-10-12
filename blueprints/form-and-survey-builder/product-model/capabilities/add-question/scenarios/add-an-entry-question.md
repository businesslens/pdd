---
kind: primary
routes:
  web: Web
steps:
  - text: The Creator starts a new question at the end of the form and chooses a short answer, a paragraph, a rating or a date
    kind: actor
    actor: creator
    entities:
      - { entity: form, effect: reads, facts: [Question order] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Creator writes the prompt and marks whether an answer is required
    kind: actor
    actor: creator
    entities: []
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Product adds the question at the end of the form
    kind: product
    actor: creator
    entities:
      - { entity: entry-question, effect: creates, to: Included, facts: [Prompt, Answer type, Required] }
      - { entity: form, effect: changes, facts: [Question order] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
---

# Add an entry question

## Trigger

The Creator wants Respondents to answer in their own words, with a rating, or with a date.

## Outcome

The form ends with the new question, its answer type and its required setting.

## Edge cases

- The form is already open → Respondents who open it from now on see the question; responses already received have no answer to it.
