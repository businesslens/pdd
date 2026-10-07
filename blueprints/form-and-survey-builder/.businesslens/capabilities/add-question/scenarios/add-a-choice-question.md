---
kind: primary
routes:
  web: Web
steps:
  - text: The Creator starts a new question at the end of the form and chooses whether one option or several may be picked
    kind: actor
    actor: creator
    entities:
      - { entity: form, effect: reads, facts: [Question order] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Creator writes the prompt, lists the options and marks whether an answer is required
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
      - { entity: choice-question, effect: creates, to: Included, facts: [Prompt, Selection, Options, Required] }
      - { entity: form, effect: changes, facts: [Question order] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
---

# Add a choice question

## Trigger

The Creator wants Respondents to pick from a list of options.

## Outcome

The form ends with the new question, its options and its required setting.

## Edge cases

- The form is already open → Respondents who open it from now on see the question; responses already received have no answer to it.
