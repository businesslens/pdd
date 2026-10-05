---
kind: edge
result: not-achieved
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
  - text: The Product sends the material to a language model, which writes nothing the material answers
    kind: product
    actor: creator
    capability: draft-questions
    entities:
      - { entity: quiz, effect: reads, facts: [Source material] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Product says why no drafts were written
    kind: product
    actor: creator
    capability: draft-questions
    entities: []
    contexts:
      web:
        place: quiz-web::quiz-editor
---

# Find nothing worth drafting

## Trigger

The Creator asks for drafts from material too short or too vague to ask about.

## Outcome

The Journey goal is not achieved: no question was drafted, and the quiz is
unchanged.
