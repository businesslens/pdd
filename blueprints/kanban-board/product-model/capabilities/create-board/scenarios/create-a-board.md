---
kind: primary
routes:
  web: Web
steps:
  - text: The Teammate creates a board by naming it and becomes its first admin
    kind: actor
    actor: teammate
    entities:
      - { entity: board, effect: creates, facts: [Name, Stall threshold] }
      - { entity: board-membership, effect: creates, facts: [Role], with: board }
    contexts:
      web:
        place: board-web::board-list
  - text: The Product gives the board To do, Doing and Done columns and the default stall threshold
    kind: product
    actor: teammate
    entities:
      - { entity: column, effect: creates, facts: [Name, Position] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board-list
  - text: The Product opens the settings of the new board so the Teammate can add colleagues
    kind: product
    actor: teammate
    entities:
      - { entity: board, effect: reads, facts: [Name] }
      - { entity: board-membership, effect: reads, facts: [Role] }
    contexts:
      web:
        place: board-web::board-settings
---

# Create a board

## Trigger

The Teammate wants a new board for a stream of work.

## Outcome

A board with the chosen name and the columns To do, Doing and Done exists, the Teammate is its only member and its admin, and the board's members are in front of them to add colleagues to or to go on from to the board.

## Edge cases

- The Teammate goes on to the board without adding anyone → the board opens with its three empty columns and the Teammate as its only member.
