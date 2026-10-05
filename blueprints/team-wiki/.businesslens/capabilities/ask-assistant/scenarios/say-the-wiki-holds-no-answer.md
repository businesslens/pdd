---
kind: edge
routes:
  web: Web
steps:
  - text: The Member asks the Assistant a question
    kind: actor
    actor: member
    entities:
      - { entity: assistant, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::workspace::assistant
  - text: The Assistant finds no page the Member may read that answers it
    kind: actor
    actor: assistant
    entities:
      - { entity: page, effect: reads, facts: [Title, Content] }
      - { entity: member, effect: reads, facts: [] }
  - text: The Assistant says the wiki does not answer the question and cites nothing
    kind: actor
    actor: assistant
    entities: []
    contexts:
      web:
        place: wiki-web::workspace::assistant
---

# Say the wiki holds no answer

## Trigger

A Member asks something the pages they may read do not cover.

## Outcome

The Member knows the wiki holds no answer for them, and has not been given an
uncited guess.

## Edge cases

- The only page that answers is in a space the Member does not belong to → the Assistant answers exactly as if no page did, and reveals neither the page nor its space.
