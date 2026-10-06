---
kind: edge
routes:
  web: Web
steps:
  - text: The Learner chooses to delete a deck they own that is shared
    kind: actor
    actor: learner
    entities:
      - { entity: deck, effect: reads, facts: [Name, Share link] }
    contexts:
      web:
        place: flashcards-web::deck-detail
  - text: The Product explains that the deck and everything in it will be deleted for good, that its share link will stop working, and that copies other Learners made will stay theirs
    kind: product
    actor: learner
    entities:
      - { entity: deck, effect: reads, facts: [Share link] }
    contexts:
      web:
        place: flashcards-web::deck-detail
  - text: The Learner confirms
    kind: actor
    actor: learner
    entities:
      - { entity: deck, effect: removes, from: Shared }
      - { entity: card, as: new-card, effect: removes, from: New }
      - { entity: card, as: learning-card, effect: removes, from: Learning }
      - { entity: card, as: known-card, effect: removes, from: Known }
      - { entity: card-proposal, as: waiting-proposal, effect: removes, from: Proposed }
      - { entity: card-proposal, as: accepted-proposal, effect: removes, from: Accepted }
      - { entity: card-proposal, as: dismissed-proposal, effect: removes, from: Dismissed }
    contexts:
      web:
        place: flashcards-web::deck-detail
  - text: The Product returns the Learner to their library
    kind: product
    actor: learner
    entities: []
    contexts:
      web:
        place: flashcards-web::deck-library
---

# Delete a shared deck

## Trigger

The Learner chooses to delete a deck they own while it is shared.

## Outcome

The deck and everything in it are gone for good and its share link opens nothing.
Copies other Learners made earlier are unaffected.
