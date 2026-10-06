---
kind: primary
routes:
  web: Web
steps:
  - text: The Teammate asks to delete a card
    kind: actor
    actor: teammate
    entities:
      - { entity: card, effect: reads, facts: [Title] }
    contexts:
      web:
        place: board-web::card-detail
  - text: The Product asks the Teammate to confirm that the card and its comments go for good
    kind: product
    actor: teammate
    entities:
      - { entity: card, effect: reads, facts: [Title] }
      - { entity: comment, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::card-detail
  - text: The Teammate confirms
    kind: actor
    actor: teammate
    entities: []
    contexts:
      web:
        place: board-web::card-detail
  - text: The Product deletes the card for good, with its comments and stall flags
    kind: product
    actor: teammate
    entities:
      - { entity: card, effect: removes }
      - { entity: comment, effect: removes, with: card }
      - { entity: stall-flag, as: raised, effect: removes, from: Raised, with: card }
      - { entity: stall-flag, as: cleared, effect: removes, from: Cleared, with: card }
    contexts:
      web:
        place: board-web::card-detail
  - text: Its column no longer shows it, for every member
    kind: condition
    actor: teammate
    entities:
      - { entity: column, effect: reads, facts: [] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::board
---

# Delete a card

## Trigger

A member decides a card is not work the team will do, such as one added by mistake.

## Outcome

The card, its comments and its stall flags are gone for good, and the other cards in its column keep their order.

## Edge cases

- The member cancels at the confirmation → nothing is deleted.
