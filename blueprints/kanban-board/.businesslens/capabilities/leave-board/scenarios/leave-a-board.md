---
kind: primary
routes:
  web: Web
steps:
  - text: The Teammate chooses to leave a board
    kind: actor
    actor: teammate
    entities:
      - { entity: board, effect: reads, facts: [Name] }
    contexts:
      web:
        place: board-web::board-settings
  - text: The Product ends the membership of the Teammate and takes them off every card on the board
    kind: product
    actor: teammate
    entities:
      - { entity: board-membership, effect: removes }
      - { entity: card, effect: changes, facts: [Assignees] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board-settings
  - text: The board is no longer in the board list of the Teammate
    kind: condition
    actor: teammate
    entities:
      - { entity: board, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board-list
---

# Leave a board

## Trigger

A member no longer works on the board.

## Outcome

The Teammate is no longer a member, the board is gone from their board list, and they are no longer assigned to its cards.
