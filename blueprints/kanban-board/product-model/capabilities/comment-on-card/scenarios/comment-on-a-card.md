---
kind: primary
routes:
  web: Web
steps:
  - text: The Teammate posts a comment on a card
    kind: actor
    actor: teammate
    entities:
      - { entity: card, effect: reads, facts: [Title] }
      - { entity: comment, effect: creates, facts: [Text, Posted at] }
    contexts:
      web:
        place: board-web::card-detail
  - text: The comment appears under the card after the earlier comments, with the name of the Teammate and when it was posted
    kind: condition
    actor: teammate
    entities:
      - { entity: comment, effect: reads, facts: [Text, Posted at] }
      - { entity: card, effect: reads, facts: [] }
    contexts:
      web:
        place: board-web::card-detail
---

# Comment on a card

## Trigger

A member has something to tell the team about a card.

## Outcome

The comment is on the card for every member of the board to read, with its author's name and when it was posted, and the card is otherwise unchanged.

## Edge cases

- The comment is empty → nothing is posted.
