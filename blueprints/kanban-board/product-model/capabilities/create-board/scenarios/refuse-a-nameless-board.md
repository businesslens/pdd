---
kind: validation
routes:
  web: Web
steps:
  - text: The Teammate confirms a new board while leaving its name empty
    kind: actor
    actor: teammate
    entities:
      - { entity: board, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board-list
  - text: The Product refuses and asks for a name
    kind: product
    actor: teammate
    entities: []
    contexts:
      web:
        place: board-web::board-list
  - text: Nothing new appears in the board list
    kind: condition
    actor: teammate
    entities:
      - { entity: board, effect: reads, facts: [Name] }
    contexts:
      web:
        place: board-web::board-list
---

# Refuse a nameless board

## Trigger

The Teammate confirms a new board without naming it.

## Outcome

No board is created, and the Teammate is asked for a name.
