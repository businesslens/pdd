---
kind: validation
routes:
  web: Web
steps:
  - text: The Teammate, whose role on the board is Member, tries to delete it
    kind: actor
    actor: teammate
    entities:
      - { entity: board, effect: reads, facts: [Name] }
    contexts:
      web:
        place: board-web::board-settings
  - text: The Product checks the role of the Teammate on the board and refuses
    kind: product
    actor: teammate
    entities:
      - { entity: board-membership, effect: reads, facts: [Role] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board-settings
  - text: The board and everything on it are unchanged
    kind: condition
    actor: teammate
    entities:
      - { entity: board, effect: reads, facts: [Name] }
      - { entity: card, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board-settings
---

# Refuse board deletion by a member

## Trigger

A Teammate whose role on the board is Member tries to delete the board.

## Outcome

The board, its cards and its members are unchanged.
