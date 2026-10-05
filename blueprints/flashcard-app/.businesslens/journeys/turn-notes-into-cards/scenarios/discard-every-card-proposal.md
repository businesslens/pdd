---
kind: edge
result: not-achieved
routes:
  web: Web
steps:
  - text: The Learner pastes notes for a deck they own and asks for drafts
    kind: actor
    actor: learner
    capability: generate-cards
    entities:
      - { entity: deck, effect: reads, facts: [Name] }
    contexts:
      web:
        place: flashcards-web::card-proposals
  - text: The Product drafts card proposals from the notes with a language model
    kind: product
    actor: learner
    capability: generate-cards
    entities:
      - { entity: card-proposal, effect: creates, facts: [Front, Back, Source passage] }
    contexts:
      web:
        place: flashcards-web::card-proposals
  - text: The Learner discards every card proposal
    kind: actor
    actor: learner
    capability: discard-card-proposal
    entities:
      - { entity: card-proposal, effect: removes }
    contexts:
      web:
        place: flashcards-web::card-proposals
---

# Discard every card proposal

## Trigger

The Learner finds none of the drafted proposals worth studying.

## Outcome

The Journey goal is not achieved: no card is added, and the deck is exactly as
it was before the notes were pasted.
