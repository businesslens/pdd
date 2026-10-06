---
kind: validation
routes:
  web: Web
steps:
  - text: The Teammate, who created the board but whose role on it is now Member, enters the email address of a colleague's account
    kind: actor
    actor: teammate
    entities:
      - { entity: teammate, as: colleague, effect: reads, facts: [Email address] }
      - { entity: board, effect: reads, facts: [Name] }
    contexts:
      web:
        place: board-web::board-settings
  - text: The Product checks the role of the Teammate on the board and refuses, because having created the board admitted only its first membership
    kind: product
    actor: teammate
    entities:
      - { entity: board-membership, effect: reads, facts: [Role] }
      - { entity: board, effect: reads, facts: [Member count] }
    contexts:
      web:
        place: board-web::board-settings
  - text: The members of the board are unchanged
    kind: condition
    actor: teammate
    entities:
      - { entity: board-membership, effect: reads, facts: [Role] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board-settings
---

# Refuse an addition by a demoted creator

## Trigger

The Teammate who created a board, since made a Member by another admin, tries to add a colleague to it.

## Outcome

Nobody is added to the board, and the Teammate's own role is unchanged.

## Edge cases

- The creator has left the board → they cannot open the board's settings at all, so they add nobody.
