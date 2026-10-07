---
kind: validation
routes:
  web: Web
steps:
  - text: The Teammate, whose role on the board is Member, tries to change a colleague's role
    kind: actor
    actor: teammate
    entities:
      - { entity: board-membership, as: other, effect: reads, facts: [Role] }
      - { entity: teammate, as: colleague, effect: reads, facts: [Name] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board-settings
  - text: The Product checks the role of the Teammate on the board, not the colleague's, and refuses
    kind: product
    actor: teammate
    entities:
      - { entity: board-membership, as: own, effect: reads, facts: [Role] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board-settings
  - text: The colleague's role is unchanged
    kind: condition
    actor: teammate
    entities:
      - { entity: board-membership, as: other, effect: reads, facts: [Role] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board-settings
---

# Refuse a role change by a member

## Trigger

A Teammate whose role on the board is Member tries to make a colleague an admin, or an admin a Member.

## Outcome

Every role on the board is unchanged.

## Edge cases

- The Member tries to make themselves an admin → refused the same way.
