---
kind: edge
routes:
  web: Web
steps:
  - text: The Creator chooses to delete a form that is still open
    kind: actor
    actor: creator
    entities:
      - { entity: form, effect: reads, facts: [Title] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Product asks the Creator to confirm, saying the form is still taking responses, how many will be deleted with it, and that its public link will stop working at once
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
      - { entity: form, effect: removes, from: Open }
      - { entity: choice-question, as: included-choice, effect: removes, from: Included }
      - { entity: choice-question, as: proposed-choice, effect: removes, from: Proposed }
      - { entity: entry-question, as: included-entry, effect: removes, from: Included }
      - { entity: entry-question, as: proposed-entry, effect: removes, from: Proposed }
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

# Delete an open form

## Trigger

The Creator no longer wants a form while it is still taking responses.

## Outcome

The form, its questions, the questions proposed for it and its responses are
gone for good, and its public link stops working at once.

## Edge cases

- The Creator declines to confirm → the form stays open and keeps taking responses.
- A Respondent is partway through answering when it is deleted → their response is refused when they submit it, because the form no longer exists.
