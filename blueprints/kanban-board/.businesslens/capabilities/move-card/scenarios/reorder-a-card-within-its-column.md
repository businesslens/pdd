---
kind: edge
routes:
  web: Web
steps:
  - text: The Teammate moves a card up or down within its column
    kind: actor
    actor: teammate
    entities:
      - { entity: card, effect: reads, facts: [Title, Position] }
      - { entity: column, effect: reads, facts: [Name] }
    contexts:
      web:
        place: board-web::board
  - text: The Product places the card at the new position
    kind: product
    actor: teammate
    entities:
      - { entity: card, effect: changes, facts: [Position] }
      - { entity: column, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board
  - text: The time the card has spent in the column is unchanged
    kind: condition
    actor: teammate
    entities:
      - { entity: card, effect: reads, facts: [Entered column at] }
      - { entity: column, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board
---

# Reorder a card within its column

## Trigger

A member changes a card's priority within the column it is in.

## Outcome

The card is at its new position in the same column, and its time in the column and any stall flag it carries are unchanged.
