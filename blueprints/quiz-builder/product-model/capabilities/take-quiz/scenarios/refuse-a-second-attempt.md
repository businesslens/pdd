---
kind: validation
routes:
  web: Web
steps:
  - text: The Learner opens a quiz they have already submitted an attempt at
    kind: actor
    actor: learner
    entities:
      - { entity: quiz, effect: reads, facts: [Title] }
      - { entity: attempt, effect: reads, facts: [] }
    contexts:
      web:
        place: quiz-web::attempt
  - text: The Product shows the Learner their submitted attempt instead of starting another, with the way to practice what they missed
    kind: product
    actor: learner
    entities:
      - { entity: attempt, effect: reads, facts: [Answers, Score] }
    contexts:
      web:
        place: quiz-web::attempt
  - text: No second attempt is started and the recorded score is unchanged
    kind: condition
    actor: learner
    entities:
      - { entity: attempt, effect: reads, facts: [Score] }
    contexts:
      web:
        place: quiz-web::attempt
---

# Refuse a second attempt

## Trigger

The Learner tries to take a quiz again after submitting.

## Outcome

The Learner sees their result and can practice; the quiz still holds one attempt
from them.
