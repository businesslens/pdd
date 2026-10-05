---
kind: primary
routes:
  web: Web
steps:
  - text: The Creator opens the results of their quiz
    kind: actor
    actor: creator
    entities:
      - { entity: quiz, effect: reads, facts: [Title, Question order] }
    contexts:
      web:
        place: quiz-web::quiz-results
  - text: The Product shows, for each question, how many submitted attempts answered it right and the answers given
    kind: product
    actor: creator
    entities:
      - { entity: question, effect: reads, facts: [Prompt, Correct answer] }
      - { entity: attempt, effect: reads, facts: [Answers] }
    contexts:
      web:
        place: quiz-web::quiz-results
  - text: The Product lists every submitted attempt by the display name of whoever made it, with its score
    kind: product
    actor: creator
    entities:
      - { entity: attempt, effect: reads, facts: [Score, Submitted at] }
      - { entity: account, effect: reads, facts: [Display name] }
    contexts:
      web:
        place: quiz-web::quiz-results
  - text: Attempts still in progress are not counted
    kind: condition
    actor: creator
    entities:
      - { entity: attempt, effect: reads, facts: [] }
    contexts:
      web:
        place: quiz-web::quiz-results
---

# Review results by question and learner

## Trigger

The Creator wants to know how learners did on a quiz.

## Outcome

The Creator sees results per question and per learner, drawn only from submitted
attempts.
