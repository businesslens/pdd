---
kind: primary
routes:
  web: Web
steps:
  - text: The Creator chooses to remove a learner from their class
    kind: actor
    actor: creator
    entities:
      - { entity: class, effect: reads, facts: [Name] }
      - { entity: enrollment, effect: reads, facts: [Joined at] }
      - { entity: learner, effect: reads, facts: [] }
      - { entity: account, effect: reads, facts: [Display name] }
    contexts:
      web:
        place: quiz-web::class
  - text: The Product asks the Creator to confirm, and says the learner keeps the attempts they made
    kind: product
    actor: creator
    entities:
      - { entity: learner, effect: reads, facts: [] }
      - { entity: account, effect: reads, facts: [Display name] }
      - { entity: attempt, effect: reads, facts: [] }
    contexts:
      web:
        place: quiz-web::class
  - text: The Creator confirms
    kind: actor
    actor: creator
    entities:
      - { entity: enrollment, effect: removes }
    contexts:
      web:
        place: quiz-web::class
  - text: The learner is no longer listed in the class, and their attempts and their scores are unchanged
    kind: condition
    actor: creator
    entities:
      - { entity: class, effect: reads, facts: [] }
      - { entity: enrollment, effect: reads, facts: [] }
      - { entity: learner, effect: reads, facts: [] }
      - { entity: attempt, effect: reads, facts: [Score] }
    contexts:
      web:
        place: quiz-web::class
---

# Remove a learner from a class

## Trigger

Someone in the Creator's class should no longer be in it.

## Outcome

The learner is out of the class and no longer has its quizzes listed through
it. The attempts they submitted, with their scores, remain in the quiz results.

## Edge cases

- The Creator declines to confirm → the learner stays in the class.
- The learner has an attempt in progress → it stays theirs to finish while the quiz is open.
- The learner still has the class's join code → they can join it again.
