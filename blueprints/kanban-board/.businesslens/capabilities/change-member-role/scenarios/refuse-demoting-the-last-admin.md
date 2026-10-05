---
kind: validation
routes:
  web: Web
steps:
  - text: The Teammate, the only admin of the board, changes their own role to Member
    kind: actor
    actor: teammate
    entities:
      - { entity: board-membership, effect: reads, facts: [Role] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board-settings
  - text: The Product refuses because the board would have no admin
    kind: product
    actor: teammate
    entities:
      - { entity: board-membership, effect: reads, facts: [Role] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board-settings
  - text: The role is unchanged
    kind: condition
    actor: teammate
    entities:
      - { entity: board-membership, effect: reads, facts: [Role] }
    contexts:
      web:
        place: board-web::board-settings
---

# Refuse demoting the last admin

## Trigger

A board's only admin tries to make themselves a Member.

## Outcome

The Teammate remains the admin of the board, and knows another admin is needed first.
