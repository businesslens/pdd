---
kind: primary
routes:
  web: Web
steps:
  - text: The Learner opens their submitted attempt and chooses to practice what they missed
    kind: actor
    actor: learner
    entities:
      - { entity: attempt, effect: reads, facts: [Answers, Score] }
    contexts:
      web:
        place: quiz-web::attempt
  - text: The Product finds the questions whose answers in the attempt did not score
    kind: product
    actor: learner
    entities:
      - { entity: attempt, effect: reads, facts: [Answers] }
      - { entity: question, effect: reads, facts: [] }
    contexts:
      web:
        place: quiz-web::attempt
  - text: The Product starts a practice round of those questions
    kind: product
    actor: learner
    entities:
      - { entity: practice-round, effect: creates, to: In progress, facts: [Questions] }
      - { entity: question, effect: reads, facts: [] }
    contexts:
      web:
        place: quiz-web::practice
  - text: The Learner answers each question in turn
    kind: actor
    actor: learner
    entities:
      - { entity: practice-round, effect: changes, facts: [Answers] }
      - { entity: question, effect: reads, facts: [Prompt, Answer options] }
    contexts:
      web:
        place: quiz-web::practice
  - text: The Product says after each answer whether it was right
    kind: product
    actor: learner
    entities:
      - { entity: practice-round, effect: reads, facts: [Answers] }
    contexts:
      web:
        place: quiz-web::practice
  - text: The Product finishes the round with how many the Learner got right
    kind: product
    actor: learner
    entities:
      - { entity: practice-round, effect: changes, from: In progress, to: Finished, facts: [Correct count] }
    contexts:
      web:
        place: quiz-web::practice
  - text: The attempt and its score are unchanged
    kind: condition
    actor: learner
    entities:
      - { entity: attempt, effect: reads, facts: [Score] }
    contexts:
      web:
        place: quiz-web::practice
---

# Practice what was missed

## Trigger

The Learner sees questions they missed and wants to try them again.

## Decision points

### Answer reveal

Does the quiz reveal answers?

- Answer reveal is on → after each answer the Learner also sees the correct answer and its explanation
- Answer reveal is off → the Learner sees only whether each answer was right

## Outcome

The Learner has answered every missed question again and knows how many they now
get right; the attempt their Creator sees is unchanged.

## Edge cases

- The quiz has closed since the attempt → practice is still available.
- A missed question has since been removed from the quiz → it is not repeated.
