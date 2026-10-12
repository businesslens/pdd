---
kind: validation
routes:
  web: Web
steps:
  - text: The Teammate, whose role on the board is Member, tries to remove a colleague from it
    kind: actor
    actor: teammate
    entities:
      - { entity: board-membership, as: other, effect: reads, facts: [Role] }
      - { entity: teammate, as: colleague, effect: reads, facts: [Name] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board-settings
  - text: The Product checks the role of the Teammate on the board and refuses
    kind: product
    actor: teammate
    entities:
      - { entity: board-membership, as: own, effect: reads, facts: [Role] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board-settings
  - text: The colleague is still a member of the board
    kind: condition
    actor: teammate
    entities:
      - { entity: board-membership, as: other, effect: reads, facts: [Role] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board-settings
---

# Refuse a removal by a member

## Trigger

A Teammate whose role on the board is Member tries to remove a colleague.

## Outcome

Every membership of the board is unchanged.
