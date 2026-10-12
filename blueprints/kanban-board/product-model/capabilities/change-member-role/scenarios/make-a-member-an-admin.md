---
kind: primary
routes:
  web: Web
steps:
  - text: The Teammate changes another member's role to Admin
    kind: actor
    actor: teammate
    entities:
      - { entity: board-membership, as: other, effect: reads, facts: [Role] }
      - { entity: teammate, as: colleague, effect: reads, facts: [Name] }
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
  - text: The other member now holds the role Admin on the board
    kind: product
    actor: teammate
    entities:
      - { entity: board-membership, as: other, effect: changes, facts: [Role] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board-settings
---

# Make a member an admin

## Trigger

An admin wants another member to share in arranging the board.

## Outcome

The member is an admin of the board, and every other membership is unchanged.
