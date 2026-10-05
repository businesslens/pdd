---
kind: edge
routes:
  web: Web
steps:
  - text: The Teammate moves a card that carries a stall flag into another column
    kind: actor
    actor: teammate
    entities:
      - { entity: card, effect: reads, facts: [Title, Column] }
      - { entity: stall-flag, effect: reads, facts: [Reason] }
      - { entity: column, as: origin, effect: reads, facts: [Name] }
      - { entity: column, as: destination, effect: reads, facts: [Name] }
    contexts:
      web:
        place: board-web::board
  - text: The Product places the card at the chosen position in the new column
    kind: product
    actor: teammate
    entities:
      - { entity: card, effect: changes, facts: [Column, Position, Entered column at] }
      - { entity: column, as: destination, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board
  - text: The Product clears the stall flag of the card
    kind: product
    actor: teammate
    entities:
      - { entity: stall-flag, effect: changes, from: Raised, to: Cleared, facts: [] }
      - { entity: card, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board
  - text: The card no longer shows a stall flag on the board
    kind: condition
    actor: teammate
    entities:
      - { entity: card, effect: reads, facts: [] }
      - { entity: stall-flag, effect: reads, facts: [] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board
---

# Move a flagged card

## Trigger

A member moves a card the AI agent flagged as stalled into another column.

## Outcome

The card is in the new column with no stall flag, and its time in that column starts now.

## Edge cases

- The flagged card only moves within its column → the flag stays raised.
