---
kind: failure
routes:
  web: Web
steps:
  - text: The Creator states what the form should find out and asks for drafts
    kind: actor
    actor: creator
    entities:
      - { entity: form, effect: changes, facts: [Goal] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: Drafting cannot be done at the moment
    kind: condition
    entities: []
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Product says that no suggestions could be drafted and keeps the stated goal for another try
    kind: product
    actor: creator
    entities:
      - { entity: form, effect: reads, facts: [Goal] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The form's questions are exactly as they were, and the Creator can add questions by hand
    kind: condition
    actor: creator
    entities:
      - { entity: form, effect: reads, facts: [Question order] }
      - { entity: question, effect: reads, facts: [] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
---

# Draft while drafting is unavailable

## Trigger

The Creator asks for suggested questions while drafting is unavailable.

## Outcome

Nothing is suggested and the form is unchanged; building it by hand is unaffected.
