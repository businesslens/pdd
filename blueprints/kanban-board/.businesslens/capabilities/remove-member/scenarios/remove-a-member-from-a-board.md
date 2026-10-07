---
kind: primary
routes:
  web: Web
steps:
  - text: The Teammate removes a colleague from the board
    kind: actor
    actor: teammate
    entities:
      - { entity: board-membership, as: other, effect: reads, facts: [Role] }
      - { entity: teammate, as: colleague, effect: reads, facts: [Name] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board-settings
  - text: The Product confirms the Teammate is an admin of the board
    kind: product
    actor: teammate
    entities:
      - { entity: board-membership, as: own, effect: reads, facts: [Role] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board-settings
  - text: The Product asks the Teammate to confirm that the colleague loses the board and every card they are assigned to on it
    kind: product
    actor: teammate
    entities:
      - { entity: board, effect: reads, facts: [Name] }
      - { entity: card, effect: reads, facts: [Assignees] }
      - { entity: teammate, as: colleague, effect: reads, facts: [Name] }
    contexts:
      web:
        place: board-web::board-settings
  - text: The Teammate confirms
    kind: actor
    actor: teammate
    entities: []
    contexts:
      web:
        place: board-web::board-settings
  - text: The Product takes the colleague off every card on the board and ends their membership
    kind: product
    actor: teammate
    entities:
      - { entity: card, effect: changes, facts: [Assignees] }
      - { entity: board-membership, as: other, effect: removes }
      - { entity: board, effect: reads, facts: [] }
      - { entity: teammate, as: colleague, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board-settings
  - text: The comments of the colleague stay on their cards
    kind: condition
    actor: teammate
    entities:
      - { entity: comment, effect: reads, facts: [] }
      - { entity: card, effect: reads, facts: [] }
      - { entity: teammate, as: colleague, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board-settings
---

# Remove a member from a board

## Trigger

An admin decides a colleague no longer works on the board.

## Outcome

The colleague is no longer a member, cannot open the board, and is no one's assignee there; what they wrote stays.

## Edge cases

- The admin cancels at the confirmation → the colleague stays a member.
