---
kind: primary
routes:
  web: Web
steps:
  - text: The Teammate opens a card from the board
    kind: actor
    actor: teammate
    entities:
      - { entity: card, effect: reads, facts: [Title] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board
  - text: The Teammate changes its title, description or due date and saves
    kind: actor
    actor: teammate
    entities:
      - { entity: card, effect: changes, facts: [Title, Description, Due date] }
    contexts:
      web:
        place: board-web::card-detail
  - text: The card shows the new details on the board
    kind: condition
    actor: teammate
    entities:
      - { entity: card, effect: reads, facts: [Title, Due date] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board
---

# Edit a card's details

## Trigger

A member wants a card to say more precisely what the work is or when it is due.

## Outcome

The card carries the new title, description or due date, and stays where it was on the board.

## Edge cases

- The title is emptied → refused, and the card keeps its title.
- The due date is cleared → the card has no due date and is no longer overdue.
