---
kind: primary
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
  - text: The Product asks a language model to draft questions from the goal and the form's existing questions
    kind: product
    actor: creator
    entities:
      - { entity: choice-question, effect: creates, to: Proposed, facts: [Prompt, Selection, Options] }
      - { entity: entry-question, effect: creates, to: Proposed, facts: [Prompt, Answer type] }
      - { entity: form, effect: reads, facts: [Goal, Question order] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Product shows each proposed question beside the form, marked as proposed, each with a way to accept or dismiss it
    kind: product
    actor: creator
    entities:
      - { entity: choice-question, effect: reads, facts: [Prompt, Selection, Options] }
      - { entity: entry-question, effect: reads, facts: [Prompt, Answer type] }
      - { entity: form, effect: reads, facts: [Question order] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The form's questions and their order are exactly as they were
    kind: condition
    actor: creator
    entities:
      - { entity: form, effect: reads, facts: [Question order] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
---

# Draft questions from a goal

## Trigger

The Creator knows what they want to learn but not yet how to ask it.

## Outcome

Proposed questions wait beside the form for the Creator to decide; the form itself is unchanged and Respondents see none of them.

## Edge cases

- The form already has proposed questions waiting → the new drafts join them, and the earlier ones stay until the Creator decides.
