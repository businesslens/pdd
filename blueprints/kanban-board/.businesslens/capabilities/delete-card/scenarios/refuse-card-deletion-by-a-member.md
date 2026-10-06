---
kind: validation
routes:
  web: Web
steps:
  - text: The Teammate, a Member rather than an admin, tries to delete a card
    kind: actor
    actor: teammate
    entities:
      - { entity: card, effect: reads, facts: [Title] }
    contexts:
      web:
        place: board-web::card-detail
  - text: The Product checks the role of the Teammate on the board and refuses, because deleting a card deletes everyone's comments on it
    kind: product
    actor: teammate
    entities:
      - { entity: card, effect: reads, facts: [] }
      - { entity: comment, effect: reads, facts: [] }
      - { entity: board-membership, effect: reads, facts: [Role] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::card-detail
  - text: The card and its comments are unchanged
    kind: condition
    actor: teammate
    entities:
      - { entity: card, effect: reads, facts: [Title] }
      - { entity: comment, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::card-detail
---

# Refuse card deletion by a member

## Trigger

A Teammate whose role on the board is Member tries to delete a card.

## Outcome

The card, its comments and its stall flags are unchanged.

## Edge cases

- The card holds only the Member's own comments → refused the same way; deleting cards rests with the board's admins.
