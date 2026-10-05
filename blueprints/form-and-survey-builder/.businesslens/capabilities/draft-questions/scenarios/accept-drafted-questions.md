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
  - text: The Product asks a language model to draft suggested questions from the goal and the form's existing questions
    kind: product
    actor: creator
    entities:
      - { entity: suggested-question, as: kept, effect: creates, to: Proposed, facts: [Prompt, Answer type] }
      - { entity: suggested-question, as: unwanted, effect: creates, to: Proposed, facts: [Prompt, Answer type] }
      - { entity: form, effect: reads, facts: [Goal, Question order] }
      - { entity: question, effect: reads, facts: [Prompt] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Product shows each suggested question apart from the form, marked as a suggestion
    kind: product
    actor: creator
    entities:
      - { entity: suggested-question, as: kept, effect: reads, facts: [Prompt, Answer type] }
      - { entity: suggested-question, as: unwanted, effect: reads, facts: [Prompt, Answer type] }
      - { entity: form, effect: reads, facts: [Question order] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Creator accepts the suggested questions they want, and each is added at the end of the form as a question
    kind: actor
    actor: creator
    entities:
      - { entity: suggested-question, as: kept, effect: changes, from: Proposed, to: Accepted, facts: [] }
      - { entity: question, effect: creates, facts: [Prompt, Answer type, Required, Show condition] }
      - { entity: form, effect: changes, facts: [Question order] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Creator dismisses the other suggested questions
    kind: actor
    actor: creator
    entities:
      - { entity: suggested-question, as: unwanted, effect: changes, from: Proposed, to: Dismissed, facts: [] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
---

# Accept drafted questions

## Trigger

The Creator knows what they want to learn but not yet how to ask it.

## Outcome

The form holds the questions the Creator accepted and nothing they dismissed; Respondents never see a suggestion.

## Edge cases

- The Creator leaves before deciding → the undecided suggestions are dismissed and the form is unchanged; asking again drafts afresh from the kept goal.
- The Creator wants a suggestion worded differently → they accept it and change it like any other question.
