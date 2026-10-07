---
kind: edge
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
  - text: The language model cannot be reached or returns nothing usable
    kind: condition
    entities: []
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Product says that no questions could be drafted and keeps the stated goal for another try
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
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
---

# Draft while the language model is unavailable

## Trigger

The Creator asks for drafts while the language model the Product calls is unavailable.

## Outcome

Nothing is proposed and the form is unchanged; building it by hand is unaffected.
