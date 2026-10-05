---
kind: primary
routes:
  web: Web
steps:
  - text: The Teammate removes a column that holds no card
    kind: actor
    actor: teammate
    entities:
      - { entity: column, effect: reads, facts: [Name] }
      - { entity: card, effect: reads, facts: [] }
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
  - text: The Product removes the column from the board
    kind: product
    actor: teammate
    entities:
      - { entity: column, effect: removes }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board
---

# Remove an empty column

## Trigger

An admin decides an empty stage no longer belongs in the workflow.

## Outcome

The column is gone from the board, and the remaining columns keep their order.

## Edge cases

- The column is the board's only column → refused; a board always keeps at least one column.
- A pending proposed card suggests the removed column → it stays pending, and the member who accepts it chooses another column.
