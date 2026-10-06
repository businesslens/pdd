---
kind: validation
routes:
  web: Web
steps:
  - text: The Teammate, a Member rather than an admin, tries to delete a comment a colleague wrote
    kind: actor
    actor: teammate
    entities:
      - { entity: comment, effect: reads, facts: [Text] }
      - { entity: teammate, as: colleague, effect: reads, facts: [Name] }
    contexts:
      web:
        place: board-web::card-detail
  - text: The Product checks the role of the Teammate on the board and refuses, because only the comment's author or an admin deletes it
    kind: product
    actor: teammate
    entities:
      - { entity: comment, effect: reads, facts: [] }
      - { entity: board-membership, effect: reads, facts: [Role] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::card-detail
  - text: The comment stays on the card
    kind: condition
    actor: teammate
    entities:
      - { entity: comment, effect: reads, facts: [Text] }
      - { entity: card, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::card-detail
---

# Refuse deleting a colleague's comment

## Trigger

A Teammate whose role on the board is Member tries to delete a comment someone else wrote.

## Outcome

The comment is unchanged, and so is the card.
