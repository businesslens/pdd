---
kind: edge
routes:
  web: Web
steps:
  - text: The Creator chooses to open a closed form again
    kind: actor
    actor: creator
    entities:
      - { entity: form, effect: reads, facts: [Public link] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Product explains that the same public link will take responses again
    kind: product
    actor: creator
    entities:
      - { entity: form, effect: reads, facts: [Public link] }
      - { entity: response, effect: reads, facts: [] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Creator confirms
    kind: actor
    actor: creator
    entities:
      - { entity: form, effect: changes, from: Closed, to: Open, facts: [] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: Responses received before closing are kept, and new ones join them
    kind: condition
    actor: creator
    entities:
      - { entity: response, effect: reads, facts: [] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
---

# Reopen a closed form

## Trigger

The Creator wants more answers after closing a form.

## Outcome

The form is open at its former public link, with every earlier response still in place.
