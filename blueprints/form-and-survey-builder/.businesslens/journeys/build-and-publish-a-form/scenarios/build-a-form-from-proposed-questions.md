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
  - text: The Product opens the new empty form, ready to build
    kind: product
    actor: creator
    capability: create-form
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
  - text: The Product asks a language model to draft questions from the goal and shows them beside the form as proposed
    kind: product
    actor: creator
    capability: draft-questions
    entities:
      - { entity: choice-question, effect: creates, to: Proposed, facts: [Prompt, Selection, Options] }
      - { entity: entry-question, effect: creates, to: Proposed, facts: [Prompt, Answer type] }
      - { entity: form, effect: reads, facts: [Goal] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Creator accepts the proposed questions they want, and each joins the end of the form
    kind: actor
    actor: creator
    capability: accept-proposed-question
    entities:
      - { entity: choice-question, effect: changes, from: Proposed, to: Included, facts: [] }
      - { entity: form, effect: changes, facts: [Question order] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Creator dismisses the rest
    kind: actor
    actor: creator
    capability: dismiss-proposed-question
    entities:
      - { entity: entry-question, effect: removes, from: Proposed }
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
    capability: publish-form
    entities:
      - { entity: form, effect: reads, facts: [Public link] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
---

# Build a form from proposed questions

## Trigger

The Creator knows what they want to learn and wants help with the questions.

## Outcome

The Journey goal is achieved: the form is open with the proposed questions the Creator accepted, and nothing they dismissed.
