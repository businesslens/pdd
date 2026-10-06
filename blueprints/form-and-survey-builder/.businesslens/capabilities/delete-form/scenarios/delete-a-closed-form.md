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
  - text: The Creator confirms, and the form goes with its included and proposed questions and every response it received
    kind: actor
    actor: creator
    entities:
      - { entity: form, effect: removes, from: Closed }
      - { entity: choice-question, as: included-choice, effect: removes, from: Included, with: form }
      - { entity: choice-question, as: proposed-choice, effect: removes, from: Proposed, with: form }
      - { entity: entry-question, as: included-entry, effect: removes, from: Included, with: form }
      - { entity: entry-question, as: proposed-entry, effect: removes, from: Proposed, with: form }
      - { entity: response, effect: removes, with: form }
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

# Delete a closed form

## Trigger

The Creator no longer wants a form that has stopped taking responses, or
anything it collected.

## Outcome

The form, its questions, the questions proposed for it and its responses are
gone for good.

## Edge cases

- The Creator declines to confirm → the form and everything in it stay as they were.
- The Creator wants the answers first → they export the responses before deleting.
