---
kind: primary
routes:
  web: Web
steps:
  - text: The Creator dismisses a proposed entry question
    kind: actor
    actor: creator
    entities:
      - { entity: entry-question, effect: removes, from: Proposed }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Product stops showing it beside the form
    kind: product
    actor: creator
    entities:
      - { entity: form, effect: reads, facts: [Question order] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
---

# Dismiss a proposed question

## Trigger

A proposed question is not one the Creator wants to ask.

## Outcome

The proposed question is gone and the form's questions are exactly as they were.

## Edge cases

- The question is a proposed choice question → it is dismissed the same way.
- The Creator dismisses every proposed question → no question was added or changed; the stated goal is kept for the next request.
