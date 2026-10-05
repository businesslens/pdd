---
kind: primary
routes:
  web: Web
steps:
  - text: The Teammate chooses colleagues to put on a card
    kind: actor
    actor: teammate
    entities:
      - { entity: card, effect: reads, facts: [Assignees] }
      - { entity: teammate, as: assignee, effect: reads, facts: [Name] }
    contexts:
      web:
        place: board-web::card-detail
  - text: The Product checks each one is a member of the board
    kind: product
    actor: teammate
    entities:
      - { entity: board-membership, effect: reads, facts: [] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::card-detail
  - text: The card lists them as its assignees
    kind: product
    actor: teammate
    entities:
      - { entity: card, effect: changes, facts: [Assignees] }
    contexts:
      web:
        place: board-web::card-detail
  - text: The assignees show on the card on the board
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

The card lists the chosen members as its assignees, and nothing else about it changes.

## Edge cases

- The member takes an assignee off the card → the card no longer lists them, and nothing else about it changes.
