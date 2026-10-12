---
kind: primary
routes:
  web: Web
steps:
  - text: The Teammate writes a title in a column
    kind: actor
    actor: teammate
    entities:
      - { entity: column, effect: reads, facts: [Name] }
    contexts:
      web:
        place: board-web::board
  - text: The Product adds the card at the bottom of that column
    kind: product
    actor: teammate
    entities:
      - { entity: card, effect: creates, facts: [Title, Column, Position, Entered column at] }
      - { entity: column, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board
  - text: The card shows in the column for every member of the board
    kind: condition
    actor: teammate
    entities:
      - { entity: card, effect: reads, facts: [Title] }
      - { entity: column, effect: reads, facts: [] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board
---

# Add a card to a column

## Trigger

A member has a new piece of work to track.

## Outcome

A card with the title is at the bottom of the chosen column, unassigned and with no due date, and its time in the column starts now.
