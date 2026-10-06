---
kind: primary
routes:
  web: Web
steps:
  - text: The Creator starts a new multiple-choice or true/false question in their quiz
    kind: actor
    actor: creator
    entities:
      - { entity: quiz, effect: reads, facts: [Title] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Creator writes the prompt and the options, marks the one that scores, and adds an explanation and the points
    kind: actor
    actor: creator
    entities: []
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Product checks that one option is marked as scoring
    kind: product
    actor: creator
    entities: []
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Product adds the choice question at the end of the quiz
    kind: product
    actor: creator
    entities:
      - { entity: choice-question, effect: creates, to: Included, facts: [Prompt, Format, Answer options, Correct answer, Explanation, Points] }
      - { entity: quiz, effect: changes, facts: [Question order] }
    contexts:
      web:
        place: quiz-web::quiz-editor
---

# Write a choice question

## Trigger

The Creator has a question with answers for learners to choose from.

## Decision points

### Format

Which format did the Creator pick?

- Multiple choice → the Creator writes two or more options and marks the one that scores
- True/false → the options are True and False, and the Creator marks the one that scores

## Outcome

The question is part of the quiz, last in its order, and is asked of every
learner who starts an attempt afterwards.

## Edge cases

- The quiz is already open → attempts submitted before the question was added keep their scores.
