---
kind: primary
routes:
  web: Web
steps:
  - text: The Learner dismisses a card proposal
    kind: actor
    actor: learner
    entities:
      - { entity: card-proposal, from: Proposed, to: Dismissed, facts: [] }
    contexts:
      web:
        place: flashcards-web::card-proposals
  - text: Nothing is added to the deck
    kind: condition
    actor: learner
    entities:
      - { entity: deck, effect: reads, facts: [] }
    contexts:
      web:
        place: flashcards-web::card-proposals
---

# Dismiss a card proposal

## Trigger

The Learner turns down a card proposal.

## Outcome

The proposal no longer waits for a decision and the deck's cards are unchanged.
