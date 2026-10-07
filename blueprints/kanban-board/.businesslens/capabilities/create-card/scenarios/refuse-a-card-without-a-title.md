---
kind: validation
routes:
  web: Web
steps:
  - text: The Teammate confirms an empty title in a column
    kind: actor
    actor: teammate
    entities:
      - { entity: column, effect: reads, facts: [Name] }
    contexts:
      web:
        place: board-web::board
  - text: The Product refuses and adds nothing
    kind: product
    actor: teammate
    entities: []
    contexts:
      web:
        place: board-web::board
  - text: The column holds what it held before
    kind: condition
    actor: teammate
    entities:
      - { entity: column, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board
---

# Refuse a card without a title

## Trigger

A member confirms a new card without writing a title.

## Outcome

No card is created, and the column is unchanged.
