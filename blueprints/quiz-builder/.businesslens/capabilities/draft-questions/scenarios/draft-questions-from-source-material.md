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
  - text: The Quiz assistant reads the source material and the questions the quiz already asks
    kind: actor
    actor: quiz-assistant
    entities:
      - { entity: quiz, effect: reads, facts: [Source material, Question order] }
      - { entity: question, effect: reads, facts: [Prompt] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Quiz assistant writes questions the material answers, each with a correct answer and an explanation
    kind: actor
    actor: quiz-assistant
    entities:
      - { entity: question, effect: creates, to: Drafted, facts: [Prompt, Format, Answer options, Correct answer, Explanation, Points] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Product presents the drafts beside the quiz, marked as drafts
    kind: product
    actor: creator
    entities:
      - { entity: question, effect: reads, facts: [Prompt, Format, Answer options, Correct answer, Explanation, Points] }
      - { entity: quiz, effect: reads, facts: [] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The questions the quiz asks are unchanged
    kind: condition
    entities:
      - { entity: quiz, effect: reads, facts: [Question order] }
      - { entity: question, effect: reads, facts: [] }
    contexts:
      web:
        place: quiz-web::quiz-editor
---

# Draft questions from source material

## Trigger

The Creator has notes, a reading or a lesson they want a quiz on.

## Outcome

Drafted questions drawn from the material await the Creator's review; the quiz
learners take is unchanged.

## Edge cases

- The quiz already asks about part of the material → the Quiz assistant does not draft those questions again.
- The Quiz assistant cannot be reached → the Product says drafting failed and keeps the source material to try again.
