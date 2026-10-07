---
kind: primary
routes:
  web: Web
steps:
  - text: The Learner opens a quiz assigned to one of their classes
    kind: actor
    actor: learner
    entities:
      - { entity: quiz, effect: reads, facts: [Title] }
      - { entity: class, effect: reads, facts: [Name] }
    contexts:
      web:
        place: quiz-web::learning
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
  - text: The Learner starts the attempt and answers each question
    kind: actor
    actor: learner
    entities:
      - { entity: attempt, effect: creates, to: In progress, facts: [Answers] }
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

# Take a quiz assigned to a class

## Trigger

A quiz is assigned to a class the Learner belongs to.

## Decision points

### Answer reveal

Does the quiz reveal answers?

- Answer reveal is on → each question also shows its correct answer and explanation
- Answer reveal is off → only which answers scored is shown

## Outcome

The attempt is submitted and scored, and the Learner sees their score and
feedback.
