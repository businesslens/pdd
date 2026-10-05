---
kind: primary
routes:
  web: Web
steps:
  - text: The Learner reads a card proposal and the passage it came from
    kind: actor
    actor: learner
    entities:
      - { entity: card-proposal, as: kept, effect: reads, facts: [Front, Back, Source passage] }
    contexts:
      web:
        place: flashcards-web::card-proposals
  - text: The Learner keeps it, and the card proposal becomes a new card
    kind: actor
    actor: learner
    entities:
      - { entity: card-proposal, as: kept, effect: removes }
      - { entity: card, effect: creates, to: New, facts: [Front, Back, Due on] }
    contexts:
      web:
        place: flashcards-web::card-proposals
  - text: The new card is due today and the remaining card proposals still wait for a decision
    kind: condition
    actor: learner
    entities:
      - { entity: card, effect: reads, facts: [Due on] }
      - { entity: card-proposal, as: remaining, effect: reads, facts: [] }
    contexts:
      web:
        place: flashcards-web::card-proposals
---

# Keep a card proposal

## Trigger

The Learner accepts a card proposal as it was drafted.

## Outcome

The deck holds a new card with the proposal's front and back, due today, and
the proposal is gone from those waiting.
