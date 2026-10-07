---
kind: primary
routes:
  web: Web
steps:
  - text: The Teammate changes another admin's role to Member
    kind: actor
    actor: teammate
    entities:
      - { entity: board-membership, as: other, effect: reads, facts: [Role] }
      - { entity: teammate, as: colleague, effect: reads, facts: [Name] }
    contexts:
      web:
        place: board-web::board-settings
  - text: The Product confirms the Teammate is an admin of the board, and that the Teammate stays one
    kind: product
    actor: teammate
    entities:
      - { entity: board-membership, as: own, effect: reads, facts: [Role] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board-settings
  - text: The other member now holds the role Member on the board
    kind: product
    actor: teammate
    entities:
      - { entity: board-membership, as: other, effect: changes, facts: [Role] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board-settings
---

# Make an admin a member

## Trigger

An admin wants another admin to stop arranging the board and go back to working on its cards.

## Outcome

The other Teammate is a Member of the board, the Teammate is still its admin, and every other membership is unchanged.
