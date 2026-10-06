---
kind: primary
routes:
  web: Web
steps:
  - text: The Learner opens the share link of an open quiz
    kind: actor
    actor: learner
    entities:
      - { entity: quiz, effect: reads, facts: [Title] }
    contexts:
      web:
        place: quiz-web::attempt
  - text: The Product shows the quiz's title and how many questions it asks
    kind: product
    actor: learner
    entities:
      - { entity: quiz, effect: reads, facts: [Title, Question order] }
      - { entity: choice-question, effect: reads, facts: [] }
      - { entity: short-answer-question, effect: reads, facts: [] }
    contexts:
      web:
        place: quiz-web::attempt
  - text: The Learner starts the attempt
    kind: actor
    actor: learner
    entities:
      - { entity: attempt, effect: creates, to: In progress, facts: [Answers] }
    contexts:
      web:
        place: quiz-web::attempt
  - text: The Learner answers each question
    kind: actor
    actor: learner
    entities:
      - { entity: attempt, effect: changes, facts: [Answers] }
      - { entity: choice-question, effect: reads, facts: [Prompt, Answer options] }
      - { entity: short-answer-question, effect: reads, facts: [Prompt] }
    contexts:
      web:
        place: quiz-web::attempt
  - text: The Learner submits
    kind: actor
    actor: learner
    entities: []
    contexts:
      web:
        place: quiz-web::attempt
  - text: The Product scores every answer against the correct answer and submits the attempt
    kind: product
    actor: learner
    entities:
      - { entity: attempt, effect: changes, from: In progress, to: Submitted, facts: [Answers, Score, Submitted at] }
      - { entity: choice-question, effect: reads, facts: [Points] }
      - { entity: short-answer-question, effect: reads, facts: [Points] }
    contexts:
      web:
        place: quiz-web::attempt
  - text: The Product shows the Learner their score and which answers scored
    kind: product
    actor: learner
    entities:
      - { entity: attempt, effect: reads, facts: [Answers, Score] }
    contexts:
      web:
        place: quiz-web::attempt
---

# Take a quiz by its share link

## Trigger

The Learner has been sent the share link of a quiz.

## Decision points

### Answer reveal

Does the quiz reveal answers?

- Answer reveal is on → each question also shows its correct answer and explanation
- Answer reveal is off → only which answers scored is shown

## Outcome

The attempt is submitted and scored; the Learner sees their score and feedback,
and the quiz is listed in their Learning with that score.

## Edge cases

- The Learner leaves before submitting → their answers are kept and they continue the same attempt while the quiz is open.
- A short answer matches an accepted answer apart from capital letters or surrounding spaces → it scores.
