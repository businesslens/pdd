---
kind: primary
routes:
  web: Web
steps:
  - text: The Teammate takes an assignee off a card
    kind: actor
    actor: teammate
    entities:
      - { entity: card, effect: reads, facts: [Assignees] }
      - { entity: teammate, as: assignee, effect: reads, facts: [Name] }
    contexts:
      web:
        place: board-web::card-detail
  - text: The Product removes the assignee from the card
    kind: product
    actor: teammate
    entities:
      - { entity: card, effect: changes, facts: [Assignees] }
    contexts:
      web:
        place: board-web::card-detail
  - text: The card no longer shows them on the board, and its other assignees stay
    kind: condition
    actor: teammate
    entities:
      - { entity: card, effect: reads, facts: [Assignees] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board
---

# Unassign a card

## Trigger

A member is no longer working on a card, or was put on it by mistake.

## Outcome

The card no longer lists that member as an assignee, and nothing else about it
changes; a card with no assignee left is unassigned.
