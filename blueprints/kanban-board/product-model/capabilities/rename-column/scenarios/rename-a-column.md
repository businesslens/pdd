---
kind: primary
routes:
  web: Web
steps:
  - text: The Teammate gives a column a new name
    kind: actor
    actor: teammate
    entities:
      - { entity: column, effect: reads, facts: [Name] }
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
  - text: The column takes the new name
    kind: product
    actor: teammate
    entities:
      - { entity: column, effect: changes, facts: [Name] }
    contexts:
      web:
        place: board-web::board
  - text: Every card in the column stays where it was
    kind: condition
    actor: teammate
    entities:
      - { entity: card, effect: reads, facts: [Position] }
      - { entity: column, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board
---

# Rename a column

## Trigger

An admin decides a stage of the workflow should be called something else.

## Outcome

The column shows its new name, and its cards, their positions and their time in the column are unchanged.

## Edge cases

- The new name is empty → refused, and the column keeps its name.
