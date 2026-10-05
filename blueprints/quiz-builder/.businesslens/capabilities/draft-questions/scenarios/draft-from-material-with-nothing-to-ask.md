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
  - text: The Quiz assistant reads the source material
    kind: actor
    actor: quiz-assistant
    entities:
      - { entity: quiz, effect: reads, facts: [Source material] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Quiz assistant finds nothing in it that it can ask and answer with confidence
    kind: actor
    actor: quiz-assistant
    entities: []
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Product says why no drafts were written
    kind: product
    actor: creator
    entities: []
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

# Draft from material with nothing to ask

## Trigger

The Creator asks for drafts from material too short or too vague to ask about.

## Outcome

The Creator knows why nothing was drafted; the source material is kept and the
quiz is unchanged.
