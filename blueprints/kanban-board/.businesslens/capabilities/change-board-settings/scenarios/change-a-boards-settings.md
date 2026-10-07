---
kind: primary
routes:
  web: Web
steps:
  - text: The Teammate opens the settings of the board
    kind: actor
    actor: teammate
    entities:
      - { entity: board, effect: reads, facts: [Name, Stall threshold] }
    contexts:
      web:
        place: board-web::board-settings
  - text: The Product confirms the Teammate is an admin of the board
    kind: product
    actor: teammate
    entities:
      - { entity: board-membership, effect: reads, facts: [Role] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board-settings
  - text: The Teammate gives a new name or stall threshold and saves
    kind: actor
    actor: teammate
    entities:
      - { entity: board, effect: changes, facts: [Name, Stall threshold] }
    contexts:
      web:
        place: board-web::board-settings
  - text: Every member sees the board under its new name
    kind: condition
    actor: teammate
    entities:
      - { entity: board, effect: reads, facts: [Name] }
    contexts:
      web:
        place: board-web::board-settings
---

# Change a board's settings

## Trigger

An admin decides the board's name or stall threshold should change.

## Outcome

The board carries the new name and stall threshold, and later stall flags are measured against the new threshold.

## Edge cases

- The stall threshold is not a whole number of days of at least one → refused, and the previous threshold is kept.
- A card already carries a raised stall flag when the threshold is raised → the flag stays until the card moves.
