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
  - text: The language model the Product drafts with cannot be reached
    kind: condition
    entities: []
    contexts:
      web:
        place: flashcards-web::card-proposals
  - text: The Product explains that no proposals could be drafted and keeps the pasted notes in place to try again
    kind: product
    actor: learner
    entities: []
    contexts:
      web:
        place: flashcards-web::card-proposals
---

# Keep the notes when drafting fails

## Trigger

The Learner asks for cards while the language model the Product drafts with
cannot be reached.

## Outcome

No proposal is drafted, the deck is unchanged, and the Learner's pasted notes
are still there to ask again without pasting them twice.
