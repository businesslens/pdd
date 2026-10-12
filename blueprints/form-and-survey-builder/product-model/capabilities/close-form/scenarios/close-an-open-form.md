---
kind: primary
routes:
  web: Web
steps:
  - text: The Creator chooses to close an open form
    kind: actor
    actor: creator
    entities:
      - { entity: form, effect: reads, facts: [Title] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Product explains that the public link will stop taking responses and that every response received is kept
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
      - { entity: form, effect: changes, from: Open, to: Closed, facts: [] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The public link says the form is closed
    kind: condition
    actor: creator
    entities:
      - { entity: form, effect: reads, facts: [Public link] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
---

# Close an open form

## Trigger

The Creator has enough answers, or the time for answering is over.

## Outcome

The form takes no more responses, and every response it received remains readable and exportable.

## Edge cases

- The Creator declines to confirm → the form stays open and its link keeps taking responses.
