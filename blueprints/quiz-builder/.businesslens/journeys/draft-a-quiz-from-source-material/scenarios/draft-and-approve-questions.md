---
kind: primary
result: achieved
routes:
  web: Web
steps:
  - text: The Creator gives their quiz source material and asks for drafts
    kind: actor
    actor: creator
    capability: draft-questions
    entities:
      - { entity: quiz, effect: changes, facts: [Source material] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Product has a language model draft questions from the material and keeps them as drafts
    kind: product
    actor: creator
    capability: draft-questions
    entities:
      - { entity: quiz, effect: reads, facts: [Source material] }
      - { entity: question, as: kept, effect: creates, to: Drafted, facts: [Prompt, Format, Answer options, Correct answer, Explanation, Points] }
      - { entity: question, as: discarded, effect: creates, to: Drafted, facts: [Prompt, Format, Answer options, Correct answer, Explanation, Points] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Creator corrects the wording of a drafted question
    kind: actor
    actor: creator
    capability: edit-question
    entities:
      - { entity: question, as: kept, effect: changes, facts: [Prompt] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Creator adds that question to the quiz
    kind: actor
    actor: creator
    capability: add-question
    entities:
      - { entity: question, as: kept, effect: changes, from: Drafted, to: Included, facts: [] }
      - { entity: quiz, effect: changes, facts: [Question order] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Creator discards a drafted question they do not want
    kind: actor
    actor: creator
    capability: remove-question
    entities:
      - { entity: question, as: discarded, effect: removes, from: Drafted }
    contexts:
      web:
        place: quiz-web::quiz-editor
---

# Draft and approve questions

## Trigger

The Creator has notes, a reading or a lesson they want a quiz on.

## Outcome

The Journey goal is achieved: the quiz asks the corrected question the Creator
kept, and the discarded draft is gone.
