---
kind: validation
routes:
  web: Web
steps:
  - text: The Teammate tries to remove a column that still holds cards
    kind: actor
    actor: teammate
    entities:
      - { entity: column, effect: reads, facts: [Name] }
      - { entity: card, effect: reads, facts: [Column] }
    contexts:
      web:
        place: board-web::board
  - text: The Product confirms the Teammate is an admin of the board
    kind: product
    actor: teammate
    entities:
      - { entity: board-membership, effect: reads, facts: [Role] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board
  - text: The Product refuses and says the cards must be moved out first
    kind: product
    actor: teammate
    entities:
      - { entity: card, effect: reads, facts: [Column] }
    contexts:
      web:
        place: board-web::board
  - text: The column and every card in it are unchanged
    kind: condition
    actor: teammate
    entities:
      - { entity: column, effect: reads, facts: [] }
      - { entity: card, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board
---

# Refuse removing a column that holds cards

## Trigger

An admin tries to remove a column that still holds cards.

## Outcome

The column stays with all its cards, and the admin knows the cards have to be moved out first.
