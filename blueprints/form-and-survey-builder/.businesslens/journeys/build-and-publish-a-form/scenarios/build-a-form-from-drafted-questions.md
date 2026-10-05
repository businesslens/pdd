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
  - text: The Creator states what the form should find out and asks for drafts
    kind: actor
    actor: creator
    capability: draft-questions
    entities:
      - { entity: form, effect: changes, facts: [Goal] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Product asks a language model to draft suggested questions from the goal
    kind: product
    actor: creator
    capability: draft-questions
    entities:
      - { entity: suggested-question, effect: creates, to: Proposed, facts: [Prompt, Answer type] }
      - { entity: form, effect: reads, facts: [Goal] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Creator accepts the suggested questions they want, and each is added to the form as a question
    kind: actor
    actor: creator
    capability: draft-questions
    entities:
      - { entity: suggested-question, effect: changes, from: Proposed, to: Accepted, facts: [] }
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

# Build a form from drafted questions

## Trigger

The Creator knows what they want to learn and wants help with the questions.

## Outcome

The Journey goal is achieved: the form is open with the drafted questions the Creator accepted, and nothing they did not accept.
