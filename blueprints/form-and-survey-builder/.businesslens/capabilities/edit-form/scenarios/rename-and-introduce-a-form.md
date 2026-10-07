---
kind: primary
routes:
  web: Web
steps:
  - text: The Creator changes the form's title and introduction
    kind: actor
    actor: creator
    entities:
      - { entity: form, effect: changes, facts: [Title, Description] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Product keeps the new title and introduction for anyone who opens the form from now on
    kind: product
    actor: creator
    entities:
      - { entity: form, effect: reads, facts: [Title, Description] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
---

# Rename and introduce a form

## Trigger

The Creator wants the form to say what it is for before anyone answers.

## Outcome

The form carries the new title and introduction; its questions and any responses are unchanged.
