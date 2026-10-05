---
kind: primary
routes:
  web: Web
steps:
  - text: The Creator starts a new question in their quiz and picks its format
    kind: actor
    actor: creator
    entities:
      - { entity: quiz, effect: reads, facts: [Title] }
      - { entity: question, effect: reads, facts: [Format] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Creator writes the prompt, the answer options, the correct answer, an explanation and the points
    kind: actor
    actor: creator
    entities: []
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Product checks that the question has a correct answer it can score
    kind: product
    actor: creator
    entities:
      - { entity: question, effect: reads, facts: [] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Product adds the question at the end of the quiz
    kind: product
    actor: creator
    entities:
      - { entity: question, effect: creates, to: Included, facts: [Prompt, Format, Answer options, Correct answer, Explanation, Points] }
      - { entity: quiz, effect: changes, facts: [Question order] }
    contexts:
      web:
        place: quiz-web::quiz-editor
---

# Write a question

## Trigger

The Creator has a question to ask in their quiz.

## Decision points

### Format

Which format did the Creator pick?

- Multiple choice → the Creator writes two or more options and marks the one that scores
- True/false → the options are True and False, and the Creator marks the one that scores
- Short answer → there are no options, and the Creator lists the typed answers that score

## Outcome

The question is part of the quiz, last in its order, and is asked of every
learner who starts an attempt afterwards.

## Edge cases

- The quiz is already open → attempts submitted before the question was added keep their scores.
