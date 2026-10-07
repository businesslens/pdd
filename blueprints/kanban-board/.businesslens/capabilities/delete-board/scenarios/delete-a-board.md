---
kind: primary
routes:
  web: Web
steps:
  - text: The Teammate asks to delete a board
    kind: actor
    actor: teammate
    entities:
      - { entity: board, effect: reads, facts: [Name] }
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
  - text: The Product asks the Teammate to confirm that the board and everything on it go for good, for every member
    kind: product
    actor: teammate
    entities:
      - { entity: board, effect: reads, facts: [Name] }
      - { entity: card, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board-settings
  - text: The Teammate confirms
    kind: actor
    actor: teammate
    entities: []
    contexts:
      web:
        place: board-web::board-settings
  - text: The Product deletes the board for good, with its columns, cards, comments, stall flags and proposed cards, and ends every membership of it
    kind: product
    actor: teammate
    entities:
      - { entity: board, effect: removes }
      - { entity: board-membership, effect: removes, with: board }
      - { entity: column, effect: removes, with: board }
      - { entity: card, effect: removes, with: column }
      - { entity: comment, effect: removes, with: card }
      - { entity: stall-flag, as: raised, effect: removes, from: Raised, with: card }
      - { entity: stall-flag, as: cleared, effect: removes, from: Cleared, with: card }
      - { entity: proposed-card, as: waiting, effect: removes, from: Proposed, with: board }
      - { entity: proposed-card, as: accepted, effect: removes, from: Accepted, with: board }
      - { entity: proposed-card, as: dismissed, effect: removes, from: Dismissed, with: board }
    contexts:
      web:
        place: board-web::board-settings
  - text: The Teammate is back at their board list, which no longer shows the board
    kind: condition
    actor: teammate
    entities:
      - { entity: board, effect: reads, facts: [Name] }
    contexts:
      web:
        place: board-web::board-list
---

# Delete a board

## Trigger

An admin decides the team no longer needs a board.

## Outcome

The board and everything on it are gone for good, and no former member finds it
in their board list.

## Edge cases

- The admin cancels at the confirmation → nothing is deleted.
