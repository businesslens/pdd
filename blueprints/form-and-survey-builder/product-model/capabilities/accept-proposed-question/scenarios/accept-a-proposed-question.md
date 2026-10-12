---
kind: primary
routes:
  web: Web
steps:
  - text: The Creator accepts a proposed choice question
    kind: actor
    actor: creator
    entities:
      - { entity: choice-question, effect: changes, from: Proposed, to: Included, facts: [] }
      - { entity: form, effect: changes, facts: [Question order] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Product shows it at the end of the form, no longer marked as proposed
    kind: product
    actor: creator
    entities:
      - { entity: choice-question, effect: reads, facts: [Prompt, Selection, Options, Required] }
      - { entity: form, effect: reads, facts: [Question order] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
---

# Accept a proposed question

## Trigger

A proposed question asks what the Creator wants to ask.

## Outcome

The question is on the form, asked of anyone answering from now on, and the other proposed questions still wait.

## Edge cases

- The question is a proposed entry question → it is accepted the same way.
- The Creator wants it worded differently → they accept it and change it like any other question.
