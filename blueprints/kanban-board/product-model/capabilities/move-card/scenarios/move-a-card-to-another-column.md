---
kind: primary
routes:
  web: Web
steps:
  - text: The Teammate moves a card from its column into another column
    kind: actor
    actor: teammate
    entities:
      - { entity: card, effect: reads, facts: [Title, Column] }
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
  - text: The assignees, due date and comments of the card are unchanged
    kind: condition
    actor: teammate
    entities:
      - { entity: card, effect: reads, facts: [Assignees, Due date] }
      - { entity: comment, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board
---

# Move a card to another column

## Trigger

Work on a card has reached another stage.

## Outcome

The card sits at the chosen position in the new column, its time in that column starts now, and everything else about it is unchanged.
