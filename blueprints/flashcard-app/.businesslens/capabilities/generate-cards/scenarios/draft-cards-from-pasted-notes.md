---
kind: primary
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
  - text: The Assistant chooses what in the notes is worth asking and drafts a card proposal for each
    kind: actor
    actor: assistant
    entities:
      - { entity: card-proposal, effect: creates, facts: [Front, Back, Source passage] }
    contexts:
      web:
        place: flashcards-web::card-proposals
  - text: The Product presents each card proposal with the passage it was drafted from, waiting for the Learner's decision
    kind: product
    actor: learner
    entities:
      - { entity: card-proposal, effect: reads, facts: [Front, Back, Source passage] }
    contexts:
      web:
        place: flashcards-web::card-proposals
  - text: The pasted notes are not kept once drafted from, and nothing is studied until the Learner decides
    kind: condition
    actor: learner
    entities: []
    contexts:
      web:
        place: flashcards-web::card-proposals
---

# Draft cards from pasted notes

## Trigger

The Learner pastes notes for a deck they own and asks the Assistant for cards.

## Outcome

The deck has card proposals waiting for the Learner's decision, each with the
passage it came from. The deck's cards are unchanged.

## Edge cases

- The Assistant finds nothing in the notes worth a card → no proposal is drafted and the Learner is told so.
- The Learner leaves before deciding → the proposals wait in the deck for their return.
