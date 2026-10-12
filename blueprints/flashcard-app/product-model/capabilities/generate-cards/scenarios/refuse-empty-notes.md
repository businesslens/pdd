---
kind: validation
routes:
  web: Web
steps:
  - text: The Learner asks for drafts without pasting any notes
    kind: actor
    actor: learner
    entities: []
    contexts:
      web:
        place: flashcards-web::card-proposals
  - text: The Product explains that there is nothing to draft from
    kind: product
    actor: learner
    entities: []
    contexts:
      web:
        place: flashcards-web::card-proposals
---

# Refuse empty notes

## Trigger

The Learner asks for cards with no notes pasted.

## Outcome

Nothing is drafted and the Learner can paste notes and ask again.
