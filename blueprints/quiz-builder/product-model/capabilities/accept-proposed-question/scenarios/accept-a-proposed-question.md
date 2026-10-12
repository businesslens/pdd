---
kind: primary
routes:
  web: Web
steps:
  - text: The Creator reads a proposed choice question beside their quiz
    kind: actor
    actor: creator
    entities:
      - { entity: choice-question, effect: reads, facts: [Prompt, Format, Answer options, Correct answer, Explanation, Points] }
      - { entity: quiz, effect: reads, facts: [] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Creator accepts it
    kind: actor
    actor: creator
    entities:
      - { entity: choice-question, effect: changes, from: Proposed, to: Included, facts: [] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Product puts the question at the end of the quiz
    kind: product
    actor: creator
    entities:
      - { entity: quiz, effect: changes, facts: [Question order] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The other proposed questions are unchanged and stay out of the quiz
    kind: condition
    entities:
      - { entity: quiz, effect: reads, facts: [] }
    contexts:
      web:
        place: quiz-web::quiz-editor
---

# Accept a proposed question

## Trigger

The Creator reviews a question the Product proposed and wants to keep it.

## Outcome

The question is part of the quiz exactly as the Creator accepted it, and is
asked of learners from then on. Other proposed questions are untouched.

## Edge cases

- The Creator edits the proposed question first → the edited question is the one that joins the quiz.
- A proposed short-answer question → it is accepted the same way, with its accepted answers.
- The quiz is already open → attempts submitted before it joined keep their scores.
