---
kind: edge
routes:
  web: Web
steps:
  - text: The Creator chooses to delete a draft form
    kind: actor
    actor: creator
    entities:
      - { entity: form, effect: reads, facts: [Title] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Product asks the Creator to confirm, saying its questions will be deleted with it
    kind: product
    actor: creator
    entities:
      - { entity: form, effect: reads, facts: [Title] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Creator confirms, and the form goes with its included and proposed questions
    kind: actor
    actor: creator
    entities:
      - { entity: form, effect: removes, from: Draft }
      - { entity: choice-question, as: included-choice, effect: removes, from: Included, with: form }
      - { entity: choice-question, as: proposed-choice, effect: removes, from: Proposed, with: form }
      - { entity: entry-question, as: included-entry, effect: removes, from: Included, with: form }
      - { entity: entry-question, as: proposed-entry, effect: removes, from: Proposed, with: form }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: Nothing of it is left in the Creator's workspace
    kind: condition
    actor: creator
    entities: []
    contexts:
      web:
        place: forms-web::form-workspace::forms
---

# Delete a draft form

## Trigger

The Creator abandons a form before ever publishing it.

## Outcome

The form, its questions and the questions proposed for it are gone for good.
It never had a public link or responses, so nothing else goes with it.

## Edge cases

- The Creator declines to confirm → the draft and its questions stay as they were.
