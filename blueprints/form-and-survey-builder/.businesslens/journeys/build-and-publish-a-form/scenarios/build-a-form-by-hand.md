---
kind: primary
result: achieved
routes:
  web: Web
steps:
  - text: The Creator creates a new form and gives it a title
    kind: actor
    actor: creator
    capability: create-form
    entities:
      - { entity: form, effect: creates, to: Draft, facts: [Title, Question order] }
    contexts:
      web:
        place: forms-web::form-workspace::forms
  - text: The Product opens the new empty form
    kind: product
    actor: creator
    entities:
      - { entity: form, effect: reads, facts: [Title] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Creator adds the questions they want
    kind: actor
    actor: creator
    capability: add-question
    entities:
      - { entity: question, effect: creates, facts: [Prompt, Answer type, Required, Show condition] }
      - { entity: form, effect: changes, facts: [Question order] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Creator publishes the form
    kind: actor
    actor: creator
    capability: publish-form
    entities:
      - { entity: form, effect: changes, from: Draft, to: Open, facts: [Public link] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Product shows the public link to share
    kind: product
    actor: creator
    entities:
      - { entity: form, effect: reads, facts: [Public link] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
---

# Build a form by hand

## Trigger

The Creator knows the questions they want to ask.

## Outcome

The Journey goal is achieved: the form is open with the Creator's questions and its public link is ready to share.
