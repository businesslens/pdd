---
kind: primary
routes:
  web: Web
steps:
  - text: The Teammate reviews a pending proposed card
    kind: actor
    actor: teammate
    entities:
      - { entity: proposed-card, effect: reads, facts: [Title, Goal] }
      - { entity: card, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::proposed-cards
  - text: The Teammate dismisses the proposed card
    kind: actor
    actor: teammate
    entities:
      - { entity: proposed-card, effect: changes, from: Pending, to: Dismissed, facts: [] }
      - { entity: card, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::proposed-cards
  - text: Nothing is added to the board, and the proposal leaves the pending list
    kind: condition
    actor: teammate
    entities:
      - { entity: board, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::proposed-cards
---

# Dismiss a proposed card

## Trigger

A member decides a proposed card is not work the team will do.

## Outcome

The proposal is dismissed and no longer pending, and the board is unchanged.
