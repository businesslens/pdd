---
kind: validation
routes:
  web: Web
steps:
  - text: The Teammate, the only admin of the board, chooses to leave it
    kind: actor
    actor: teammate
    entities:
      - { entity: board, effect: reads, facts: [Name] }
      - { entity: board-membership, effect: reads, facts: [Role] }
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
  - text: The Teammate remains the admin of the board
    kind: condition
    actor: teammate
    entities:
      - { entity: board-membership, effect: reads, facts: [Role] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board-settings
---

# Refuse leaving as the last admin

## Trigger

A board's only admin tries to leave it.

## Outcome

The Teammate remains a member and the admin of the board, and knows another admin is needed first.
