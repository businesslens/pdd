---
kind: primary
routes:
  web: Web
steps:
  - text: The Learner reads a card proposal and the passage it came from
    kind: actor
    actor: learner
    entities:
      - { entity: card-proposal, as: accepted, effect: reads, facts: [Front, Back, Source passage] }
    contexts:
      web:
        place: flashcards-web::card-proposals
  - text: The Learner accepts it, and a new card is made from its front and back
    kind: actor
    actor: learner
    entities:
      - { entity: card-proposal, as: accepted, from: Proposed, to: Accepted, facts: [] }
      - { entity: card, effect: creates, to: New, facts: [Front, Back, Due on] }
    contexts:
      web:
        place: flashcards-web::card-proposals
  - text: The new card is due today and the other card proposals still wait for a decision
    kind: condition
    actor: learner
    entities:
      - { entity: card, effect: reads, facts: [Due on] }
      - { entity: card-proposal, as: remaining, effect: reads, facts: [] }
    contexts:
      web:
        place: flashcards-web::card-proposals
---

# Accept a card proposal

## Trigger

The Learner accepts a card proposal as it was drafted.

## Outcome

The deck holds a new card with the proposal's front and back, due today, and
the proposal no longer waits for a decision.
