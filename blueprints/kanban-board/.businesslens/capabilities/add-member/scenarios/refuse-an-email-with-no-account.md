---
kind: validation
routes:
  web: Web
steps:
  - text: The Teammate enters an email address that belongs to no account
    kind: actor
    actor: teammate
    entities: []
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
  - text: The Product finds no account and says so
    kind: product
    actor: teammate
    entities: []
    contexts:
      web:
        place: board-web::board-settings
  - text: The members of the board are unchanged
    kind: condition
    actor: teammate
    entities:
      - { entity: board, effect: reads, facts: [] }
      - { entity: board-membership, effect: reads, facts: [Role] }
    contexts:
      web:
        place: board-web::board-settings
---

# Refuse an email address with no account

## Trigger

An admin enters an email address no account uses.

## Outcome

Nobody is added to the board, and the admin knows the address has no account.
