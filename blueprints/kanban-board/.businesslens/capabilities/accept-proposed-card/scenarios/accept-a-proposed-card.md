---
kind: primary
routes:
  web: Web
steps:
  - text: The Teammate reviews a pending proposed card with its goal and suggested column
    kind: actor
    actor: teammate
    entities:
      - { entity: proposed-card, effect: reads, facts: [Title, Description, Goal, Suggested column] }
      - { entity: card, effect: reads, facts: [] }
      - { entity: column, effect: reads, facts: [Name] }
    contexts:
      web:
        place: board-web::proposed-cards
  - text: The Teammate accepts the proposed card
    kind: actor
    actor: teammate
    entities:
      - { entity: proposed-card, effect: changes, from: Pending, to: Accepted, facts: [] }
      - { entity: card, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::proposed-cards
  - text: The Product adds a card with its title and description at the bottom of the suggested column
    kind: product
    actor: teammate
    entities:
      - { entity: card, effect: creates, facts: [Title, Description, Column, Position, Entered column at] }
      - { entity: column, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::proposed-cards
  - text: The card shows on the board for every member
    kind: condition
    actor: teammate
    entities:
      - { entity: card, effect: reads, facts: [Title] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board
---

# Accept a proposed card

## Trigger

A member decides a proposed card is work the team will do.

## Outcome

A card with the proposed title and description is at the bottom of the suggested column, and the proposal is accepted and no longer pending.
