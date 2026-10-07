---
kind: edge
result: not-achieved
routes:
  web: Web
steps:
  - text: The Teammate creates a board by naming it
    kind: actor
    actor: teammate
    capability: create-board
    entities:
      - { entity: board, effect: creates, facts: [Name, Stall threshold] }
    contexts:
      web:
        place: board-web::board-list
  - text: The Product makes the Teammate the first admin of the board
    kind: product
    actor: teammate
    capability: create-board
    entities:
      - { entity: board-membership, effect: creates, facts: [Role] }
      - { entity: board, effect: reads, facts: [Member count] }
    contexts:
      web:
        place: board-web::board-list
  - text: The Product gives the board To do, Doing and Done columns
    kind: product
    actor: teammate
    capability: create-board
    entities:
      - { entity: column, effect: creates, facts: [Name, Position] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board-list
  - text: The Product opens the settings of the new board so the Teammate can add colleagues
    kind: product
    actor: teammate
    capability: create-board
    entities:
      - { entity: board, effect: reads, facts: [Name] }
      - { entity: board-membership, effect: reads, facts: [Role] }
    contexts:
      web:
        place: board-web::board-settings
  - text: The Teammate enters a colleague's email address that belongs to no account
    kind: actor
    actor: teammate
    capability: add-member
    entities: []
    contexts:
      web:
        place: board-web::board-settings
  - text: The Product finds no account and says so
    kind: product
    actor: teammate
    capability: add-member
    entities: []
    contexts:
      web:
        place: board-web::board-settings
  - text: The Teammate is still the only member of the board
    kind: condition
    actor: teammate
    entities:
      - { entity: board-membership, effect: reads, facts: [Role] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board-settings
---

# Add a colleague without an account

## Trigger

A Teammate starts a board for a colleague who has no account yet.

## Outcome

The Journey goal is not achieved: the board exists, but the colleague cannot be added until they have an account, so the Teammate is its only member.
