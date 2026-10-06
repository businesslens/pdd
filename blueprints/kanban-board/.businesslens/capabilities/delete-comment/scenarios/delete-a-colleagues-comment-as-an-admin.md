---
kind: primary
routes:
  web: Web
steps:
  - text: The Teammate asks to delete a comment a colleague wrote
    kind: actor
    actor: teammate
    entities:
      - { entity: comment, effect: reads, facts: [Text] }
      - { entity: teammate, as: colleague, effect: reads, facts: [Name] }
      - { entity: card, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::card-detail
  - text: The Product confirms the Teammate is an admin of the board
    kind: product
    actor: teammate
    entities:
      - { entity: board-membership, effect: reads, facts: [Role] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::card-detail
  - text: The Product asks the Teammate to confirm that the colleague's comment goes for good
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

# Delete a colleague's comment as an admin

## Trigger

An admin of the board decides a comment someone else wrote does not belong on the card.

## Outcome

The comment is gone for good, and the card, its author's membership and everyone else's comments are unchanged.

## Edge cases

- The admin cancels at the confirmation → nothing is deleted.
