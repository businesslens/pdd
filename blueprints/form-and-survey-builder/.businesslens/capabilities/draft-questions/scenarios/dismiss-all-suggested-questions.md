---
kind: edge
routes:
  web: Web
steps:
  - text: The Creator states what the form should find out and asks for drafts
    kind: actor
    actor: creator
    entities:
      - { entity: form, effect: changes, facts: [Goal] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Assistant drafts suggested questions from the goal
    kind: actor
    actor: assistant
    entities:
      - { entity: suggested-question, effect: creates, to: Proposed, facts: [Prompt, Answer type] }
      - { entity: form, effect: reads, facts: [Goal] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Product shows each suggested question apart from the form, marked as a suggestion
    kind: product
    actor: creator
    entities:
      - { entity: suggested-question, effect: reads, facts: [Prompt, Answer type] }
      - { entity: form, effect: reads, facts: [Question order] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Creator dismisses every suggested question
    kind: actor
    actor: creator
    entities:
      - { entity: suggested-question, effect: changes, from: Proposed, to: Dismissed, facts: [] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The form's questions are exactly as they were
    kind: condition
    actor: creator
    entities:
      - { entity: form, effect: reads, facts: [Question order] }
      - { entity: question, effect: reads, facts: [] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
---

# Dismiss all suggested questions

## Trigger

The Creator asks for suggested questions and wants none of them.

## Outcome

No question was added or changed; only the stated goal is kept for the next request.
