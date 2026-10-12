---
kind: primary
routes:
  web: Web
steps:
  - text: The Creator gives their quiz source material and asks for drafts
    kind: actor
    actor: creator
    entities:
      - { entity: quiz, effect: changes, facts: [Source material] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Product sends the source material and the questions the quiz already asks to a language model
    kind: product
    actor: creator
    entities:
      - { entity: quiz, effect: reads, facts: [Source material, Question order] }
      - { entity: choice-question, effect: reads, facts: [Prompt] }
      - { entity: short-answer-question, effect: reads, facts: [Prompt] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Product keeps each question the model writes, with the answers that score and an explanation, as a proposed question
    kind: product
    actor: creator
    entities:
      - { entity: choice-question, effect: creates, to: Proposed, facts: [Prompt, Format, Answer options, Correct answer, Explanation, Points] }
      - { entity: short-answer-question, effect: creates, to: Proposed, facts: [Prompt, Accepted answers, Explanation, Points] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Product presents the proposed questions beside the quiz, each to accept or dismiss
    kind: product
    actor: creator
    entities:
      - { entity: choice-question, effect: reads, facts: [Prompt, Format, Answer options, Correct answer, Explanation, Points] }
      - { entity: short-answer-question, effect: reads, facts: [Prompt, Accepted answers, Explanation, Points] }
      - { entity: quiz, effect: reads, facts: [] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The questions the quiz asks are unchanged
    kind: condition
    entities:
      - { entity: quiz, effect: reads, facts: [Question order] }
    contexts:
      web:
        place: quiz-web::quiz-editor
---

# Draft questions from source material

## Trigger

The Creator has notes, a reading or a lesson they want a quiz on.

## Outcome

Proposed questions drawn from the material await the Creator's decision; the
quiz learners take is unchanged.

## Edge cases

- The quiz already asks about part of the material → no draft repeats a question the quiz already asks.
- A written question has no answer the Product could score → it is not kept.
