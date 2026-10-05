---
kind: edge
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
  - text: The Product sends the source material to a language model
    kind: product
    actor: creator
    entities:
      - { entity: quiz, effect: reads, facts: [Source material] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The language model cannot be reached or does not answer
    kind: condition
    entities: []
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Product says drafting failed and keeps the source material to try again
    kind: product
    actor: creator
    entities:
      - { entity: quiz, effect: reads, facts: [Source material] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: No question is drafted and the quiz is unchanged
    kind: condition
    entities:
      - { entity: quiz, effect: reads, facts: [Question order] }
      - { entity: question, effect: reads, facts: [] }
    contexts:
      web:
        place: quiz-web::quiz-editor
---

# Draft while the language model is unavailable

## Trigger

The Creator asks for drafts while the language model is unavailable.

## Outcome

Nothing is drafted, the Creator knows why and can try again, and writing
questions by hand is unaffected.
