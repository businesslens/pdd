---
kind: primary
routes:
  web: Web
steps:
  - text: The Teammate moves a column to another place among the columns of the board
    kind: actor
    actor: teammate
    entities:
      - { entity: column, effect: reads, facts: [Name, Position] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board
  - text: The Product confirms the Teammate is an admin of the board
    kind: product
    actor: teammate
    entities:
      - { entity: board-membership, effect: reads, facts: [Role] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board
  - text: The Product places the column at its new position, with every card in it
    kind: product
    actor: teammate
    entities:
      - { entity: column, effect: changes, facts: [Position] }
      - { entity: card, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board
  - text: Every member sees the columns in their new order, and the cards in the moved column keep their order and their time in it
    kind: condition
    actor: teammate
    entities:
      - { entity: column, effect: reads, facts: [Name, Position] }
      - { entity: card, effect: reads, facts: [Position, Entered column at] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board
---

# Move a column

## Trigger

An admin wants the board's columns in the order the team's work goes through
them.

## Outcome

The column sits at its new position among the board's columns, and its cards,
their order and their time in the column are unchanged.

## Edge cases

- The column becomes the board's last → its cards count as finished work: no longer overdue, and never newly flagged as stalled.
