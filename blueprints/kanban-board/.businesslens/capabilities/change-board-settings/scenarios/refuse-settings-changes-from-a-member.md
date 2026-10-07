---
kind: validation
routes:
  web: Web
steps:
  - text: The Teammate, whose role on the board is Member, tries to change its settings
    kind: actor
    actor: teammate
    entities:
      - { entity: board, effect: reads, facts: [Name, Stall threshold] }
      - { entity: board-membership, effect: reads, facts: [Role] }
    contexts:
      web:
        place: board-web::board-settings
  - text: The Product checks the role of the Teammate on the board
    kind: product
    actor: teammate
    entities:
      - { entity: board-membership, effect: reads, facts: [Role] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board-settings
  - text: The Product refuses the change
    kind: product
    actor: teammate
    entities: []
    contexts:
      web:
        place: board-web::board-settings
  - text: The settings of the board are unchanged
    kind: condition
    actor: teammate
    entities:
      - { entity: board, effect: reads, facts: [Name, Stall threshold] }
    contexts:
      web:
        place: board-web::board-settings
---

# Refuse settings changes from a member

## Trigger

A Teammate whose role on the board is Member tries to change the board's name or stall threshold.

## Outcome

The board's settings are unchanged, and the Teammate's role is unchanged.
