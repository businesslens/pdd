---
kind: primary
routes:
  web: Web
steps:
  - text: The Teammate chooses a colleague to put on a card
    kind: actor
    actor: teammate
    entities:
      - { entity: card, effect: reads, facts: [Assignees] }
      - { entity: teammate, as: assignee, effect: reads, facts: [Name] }
    contexts:
      web:
        place: board-web::card-detail
  - text: The Product checks the colleague is a member of the board
    kind: product
    actor: teammate
    entities:
      - { entity: board-membership, effect: reads, facts: [] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::card-detail
  - text: The Product adds the colleague to the assignees of the card
    kind: product
    actor: teammate
    entities:
      - { entity: card, effect: changes, facts: [Assignees] }
    contexts:
      web:
        place: board-web::card-detail
  - text: The colleague shows among the assignees of the card on the board
    kind: condition
    actor: teammate
    entities:
      - { entity: card, effect: reads, facts: [Assignees] }
      - { entity: teammate, as: assignee, effect: reads, facts: [Name] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board
---

# Assign a card

## Trigger

A member decides who should work on a card, including themselves.

## Outcome

The card lists the chosen member among its assignees, its other assignees stay,
and nothing else about it changes.

## Edge cases

- The colleague is already an assignee of the card → nothing changes.
