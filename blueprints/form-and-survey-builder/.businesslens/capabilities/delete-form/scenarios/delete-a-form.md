---
kind: primary
routes:
  web: Web
steps:
  - text: The Creator chooses to delete a closed form
    kind: actor
    actor: creator
    entities:
      - { entity: form, effect: reads, facts: [Title] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Product asks the Creator to confirm, saying how many responses will be deleted with it and that its public link will stop working
    kind: product
    actor: creator
    entities:
      - { entity: form, effect: reads, facts: [Title, Public link] }
      - { entity: response, effect: reads, facts: [] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Creator confirms
    kind: actor
    actor: creator
    entities:
      - { entity: form, effect: removes, from: Closed }
      - { entity: choice-question, effect: removes, from: Included }
      - { entity: entry-question, effect: removes, from: Included }
      - { entity: response, effect: removes }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: Nothing of it is left in the Creator's workspace, and its public link finds nothing
    kind: condition
    actor: creator
    entities: []
    contexts:
      web:
        place: forms-web::form-workspace::forms
---

# Delete a form

## Trigger

The Creator no longer wants a form or anything it collected.

## Outcome

The form, its questions and its responses are gone for good.

## Edge cases

- The form is a draft or still open → it is deleted the same way, and an open form's public link stops taking responses at once.
- The Creator declines to confirm → the form and everything in it stay as they were.
- The Creator wants the answers first → they export the responses before deleting.
