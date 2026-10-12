---
kind: primary
routes:
  web: Web
steps:
  - text: The Teammate asks to delete a comment they wrote
    kind: actor
    actor: teammate
    entities:
      - { entity: comment, effect: reads, facts: [Text] }
      - { entity: card, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::card-detail
  - text: The Product asks the Teammate to confirm that the comment goes for good
    kind: product
    actor: teammate
    entities:
      - { entity: comment, effect: reads, facts: [Text] }
    contexts:
      web:
        place: board-web::card-detail
  - text: The Teammate confirms
    kind: actor
    actor: teammate
    entities: []
    contexts:
      web:
        place: board-web::card-detail
  - text: The Product deletes the comment for good
    kind: product
    actor: teammate
    entities:
      - { entity: comment, effect: removes }
    contexts:
      web:
        place: board-web::card-detail
  - text: The comment is gone from the card for every member, and the other comments keep their order
    kind: condition
    actor: teammate
    entities:
      - { entity: comment, effect: reads, facts: [Posted at] }
      - { entity: card, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::card-detail
---

# Delete a comment

## Trigger

A Teammate wants to take back something they wrote on a card.

## Outcome

The comment is gone for good, and the card and everyone else's comments are unchanged.

## Edge cases

- The Teammate cancels at the confirmation → nothing is deleted.
