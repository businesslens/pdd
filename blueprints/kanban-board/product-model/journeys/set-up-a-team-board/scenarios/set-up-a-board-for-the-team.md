---
kind: primary
result: achieved
routes:
  web: Web
steps:
  - text: The Teammate creates a board by naming it and becomes its first admin
    kind: actor
    actor: teammate
    capability: create-board
    entities:
      - { entity: board, effect: creates, facts: [Name, Stall threshold] }
      - { entity: board-membership, as: own, effect: creates, facts: [Role], with: board }
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
      - { entity: board-membership, as: own, effect: reads, facts: [Role] }
    contexts:
      web:
        place: board-web::board-settings
  - text: The Teammate adds a colleague to the board as a Member by their account's email address
    kind: actor
    actor: teammate
    capability: add-member
    entities:
      - { entity: teammate, as: colleague, effect: reads, facts: [Email address] }
      - { entity: board-membership, as: colleague-membership, effect: creates, facts: [Role] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board-settings
  - text: The Teammate goes on to the board, where both members see its three empty columns
    kind: actor
    actor: teammate
    entities:
      - { entity: board, effect: reads, facts: [Name] }
      - { entity: column, effect: reads, facts: [Name, Position] }
    contexts:
      web:
        place: board-web::board
---

# Set up a board for the team

## Trigger

A Teammate starts organizing a stream of work for their team.

## Outcome

The Journey goal is achieved: the team has a board with its columns, and the colleague is a member of it with the role Member.
