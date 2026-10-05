---
kind: primary
routes:
  web: Web
steps:
  - text: The Creator reads a drafted question beside their quiz
    kind: actor
    actor: creator
    entities:
      - { entity: question, effect: reads, facts: [Prompt, Format, Answer options, Correct answer, Explanation, Points] }
      - { entity: quiz, effect: reads, facts: [] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Creator adds it to the quiz
    kind: actor
    actor: creator
    entities:
      - { entity: question, effect: reads, facts: [] }
      - { entity: quiz, effect: reads, facts: [] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Product moves the question out of the drafts and to the end of the quiz
    kind: product
    actor: creator
    entities:
      - { entity: question, effect: changes, from: Drafted, to: Included, facts: [] }
      - { entity: quiz, effect: changes, facts: [Question order] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The remaining drafts are unchanged and stay out of the quiz
    kind: condition
    entities:
      - { entity: quiz, effect: reads, facts: [] }
    contexts:
      web:
        place: quiz-web::quiz-editor
---

# Add a drafted question

## Trigger

The Creator reviews a question the Product drafted and wants to keep it.

## Outcome

The question is part of the quiz exactly as the Creator accepted it, and is
asked of learners from then on. Other drafts are untouched.

## Edge cases

- The Creator edits the draft first → the edited question is the one that joins the quiz.
