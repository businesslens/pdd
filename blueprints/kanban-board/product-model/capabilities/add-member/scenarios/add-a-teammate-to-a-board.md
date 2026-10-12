---
kind: primary
routes:
  web: Web
steps:
  - text: The Teammate enters the email address of a colleague's account and chooses a role
    kind: actor
    actor: teammate
    entities:
      - { entity: teammate, as: colleague, effect: reads, facts: [Email address] }
    contexts:
      web:
        place: board-web::board-settings
  - text: The Product confirms the Teammate is an admin of the board
    kind: product
    actor: teammate
    entities:
      - { entity: board-membership, effect: reads, facts: [Role] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board-settings
  - text: The Product finds the account and adds the colleague to the board with that role
    kind: product
    actor: teammate
    entities:
      - { entity: board-membership, effect: creates, facts: [Role] }
      - { entity: teammate, as: colleague, effect: reads, facts: [Name] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board-settings
  - text: The colleague can open the board from their board list
    kind: condition
    actor: teammate
    entities:
      - { entity: board, effect: reads, facts: [Name] }
      - { entity: teammate, as: colleague, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board-list
---

# Add a Teammate to a board

## Trigger

An admin wants a colleague to work on the board.

## Outcome

The colleague is a member of the board with the chosen role, and the board is in their board list.

## Edge cases

- The account already belongs to a member of the board → refused, and that member keeps their role.
