---
kind: primary
result: achieved
routes:
  web: Web
steps:
  - text: The Learner enters the join code they were given
    kind: actor
    actor: learner
    capability: join-class
    entities: []
    contexts:
      web:
        place: quiz-web::classes
  - text: The Product adds the Learner to the class the code belongs to
    kind: product
    actor: learner
    capability: join-class
    entities:
      - { entity: enrollment, effect: creates, facts: [Joined at] }
      - { entity: class, effect: reads, facts: [] }
    contexts:
      web:
        place: quiz-web::classes
  - text: The Product opens the class with the quizzes assigned to it
    kind: product
    actor: learner
    capability: join-class
    entities:
      - { entity: class, effect: reads, facts: [Name, Assigned quizzes] }
      - { entity: quiz, effect: reads, facts: [Title] }
    contexts:
      web:
        place: quiz-web::class
  - text: The Learner opens an open quiz assigned to the class and starts their attempt
    kind: actor
    actor: learner
    capability: take-quiz
    entities:
      - { entity: class, effect: reads, facts: [Assigned quizzes] }
      - { entity: quiz, effect: reads, facts: [Title] }
      - { entity: attempt, effect: creates, to: In progress, facts: [Answers] }
    contexts:
      web:
        place: quiz-web::class
  - text: The Learner answers each question and submits
    kind: actor
    actor: learner
    capability: take-quiz
    entities:
      - { entity: attempt, effect: changes, facts: [Answers] }
      - { entity: choice-question, effect: reads, facts: [Prompt, Answer options] }
      - { entity: short-answer-question, effect: reads, facts: [Prompt] }
    contexts:
      web:
        place: quiz-web::attempt
  - text: The Product scores every answer and shows the Learner their score and which answers scored
    kind: product
    actor: learner
    capability: take-quiz
    entities:
      - { entity: attempt, effect: changes, from: In progress, to: Submitted, facts: [Answers, Score, Submitted at] }
      - { entity: choice-question, effect: reads, facts: [Points] }
      - { entity: short-answer-question, effect: reads, facts: [Points] }
    contexts:
      web:
        place: quiz-web::attempt
---

# Join and take an assigned quiz

## Trigger

The Learner has been given a class's join code and told to take its quiz.

## Outcome

The Journey goal is achieved: the Learner is in the class and their attempt at
its quiz is submitted and scored.
