---
kind: primary
result: achieved
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
  - text: The Assistant drafts card proposals from the notes
    kind: actor
    actor: assistant
    capability: generate-cards
    entities:
      - { entity: card-proposal, as: worthwhile, effect: creates, facts: [Front, Back, Source passage] }
      - { entity: card-proposal, as: weak, effect: creates, facts: [Front, Back, Source passage] }
    contexts:
      web:
        place: flashcards-web::card-proposals
  - text: The Learner keeps a worthwhile card proposal, which becomes a new card
    kind: actor
    actor: learner
    capability: keep-card-proposal
    entities:
      - { entity: card-proposal, as: worthwhile, effect: removes }
      - { entity: card, effect: creates, to: New, facts: [Front, Back, Due on] }
    contexts:
      web:
        place: flashcards-web::card-proposals
  - text: The Learner discards a weak card proposal
    kind: actor
    actor: learner
    capability: discard-card-proposal
    entities:
      - { entity: card-proposal, as: weak, effect: removes }
    contexts:
      web:
        place: flashcards-web::card-proposals
---

# Keep the proposals worth studying

## Trigger

The Learner has notes they want to study from and asks the Assistant to draft
cards.

## Outcome

The Journey goal is achieved: the deck holds the cards the Learner kept, and
the proposals they discarded are gone.
