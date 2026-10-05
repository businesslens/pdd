---
kind: primary
routes:
  web: Web
steps:
  - text: The Teammate names a new column and chooses where it goes among the columns
    kind: actor
    actor: teammate
    entities:
      - { entity: column, effect: reads, facts: [Name, Position] }
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
  - text: The Product adds the empty column at that position
    kind: product
    actor: teammate
    entities:
      - { entity: column, effect: creates, facts: [Name, Position] }
    contexts:
      web:
        place: board-web::board
  - text: The new column appears on the board, empty
    kind: condition
    actor: teammate
    entities:
      - { entity: column, effect: reads, facts: [Name] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board
---

# Add a column

## Trigger

An admin wants a new stage in the board's workflow.

## Outcome

The board has a new, empty column with the chosen name at the chosen position, and every card stays where it was.

## Edge cases

- The name is empty → refused, and nothing is added.
