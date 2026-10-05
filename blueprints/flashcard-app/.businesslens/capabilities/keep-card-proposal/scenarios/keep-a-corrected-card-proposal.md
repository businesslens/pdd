---
kind: edge
routes:
  web: Web
steps:
  - text: The Learner corrects the front or back of a card proposal
    kind: actor
    actor: learner
    entities:
      - { entity: card-proposal, effect: reads, facts: [Front, Back, Source passage] }
    contexts:
      web:
        place: flashcards-web::card-proposals
  - text: The Learner keeps it, and the corrected card proposal becomes a new card
    kind: actor
    actor: learner
    entities:
      - { entity: card-proposal, effect: removes }
      - { entity: card, effect: creates, to: New, facts: [Front, Back, Due on] }
    contexts:
      web:
        place: flashcards-web::card-proposals
---

# Keep a corrected card proposal

## Trigger

The Learner fixes a card proposal before accepting it.

## Outcome

The deck holds a new card with the Learner's corrected text, due today, and the
proposal is gone from those waiting.

## Edge cases

- The correction leaves a side empty → nothing is kept and the Learner's correction stays in place to finish.
