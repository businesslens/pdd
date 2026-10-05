---
kind: edge
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
  - text: The Teammate changes the title, picks a different column and accepts the proposed card
    kind: actor
    actor: teammate
    entities:
      - { entity: proposed-card, effect: changes, from: Pending, to: Accepted, facts: [] }
      - { entity: card, effect: reads, facts: [] }
      - { entity: column, effect: reads, facts: [Name] }
    contexts:
      web:
        place: board-web::proposed-cards
  - text: The Product adds a card with the changed title at the bottom of the chosen column
    kind: product
    actor: teammate
    entities:
      - { entity: card, effect: creates, facts: [Title, Description, Column, Position, Entered column at] }
      - { entity: column, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::proposed-cards
  - text: The proposed card keeps its original suggestion
    kind: condition
    actor: teammate
    entities:
      - { entity: proposed-card, effect: reads, facts: [Title, Suggested column] }
      - { entity: card, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::proposed-cards
---

# Accept an adjusted proposed card

## Trigger

A member wants a proposed card, but worded differently or starting in another column.

## Outcome

A card with the member's title is in the chosen column, and the proposal is accepted.

## Edge cases

- The suggested column has been removed → the member chooses a column before accepting.
