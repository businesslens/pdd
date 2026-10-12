---
kind: validation
routes:
  web: Web
steps:
  - text: The Learner opens the share link of a closed quiz
    kind: actor
    actor: learner
    entities:
      - { entity: quiz, effect: reads, facts: [Title] }
    contexts:
      web:
        place: quiz-web::attempt
  - text: The Product says the quiz is no longer accepting attempts
    kind: product
    actor: learner
    entities:
      - { entity: quiz, effect: reads, facts: [] }
      - { entity: attempt, effect: reads, facts: [] }
    contexts:
      web:
        place: quiz-web::attempt
  - text: No attempt is started
    kind: condition
    actor: learner
    entities:
      - { entity: attempt, effect: reads, facts: [] }
    contexts:
      web:
        place: quiz-web::attempt
---

# Refuse an attempt at a closed quiz

## Trigger

The Learner follows a quiz link after its Creator closed the quiz.

## Outcome

No attempt exists and the Learner knows the quiz is closed.
