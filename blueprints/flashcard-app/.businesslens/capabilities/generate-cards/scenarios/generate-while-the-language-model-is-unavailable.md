---
kind: edge
routes:
  web: Web
steps:
  - text: The Learner pastes notes for a deck they own and asks for drafts
    kind: actor
    actor: learner
    entities:
      - { entity: deck, effect: reads, facts: [Name] }
    contexts:
      web:
        place: flashcards-web::card-proposals
  - text: The language model the Product drafts with cannot be reached or does not answer
    kind: condition
    entities: []
    contexts:
      web:
        place: flashcards-web::card-proposals
  - text: The Product says drafting failed and keeps the pasted notes in place to try again
    kind: product
    actor: learner
    entities: []
    contexts:
      web:
        place: flashcards-web::card-proposals
---

# Generate while the language model is unavailable

## Trigger

The Learner asks for cards while the language model is unavailable.

## Outcome

No card proposal is drafted, the deck is unchanged, and the Learner's pasted
notes are still there to ask again without pasting them twice. Adding cards by
hand is unaffected.
