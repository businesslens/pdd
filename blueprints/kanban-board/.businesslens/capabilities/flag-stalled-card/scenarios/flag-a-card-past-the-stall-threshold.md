---
kind: primary
routes:
  web: Web
steps:
  - text: A card has stayed in a column other than its board's last for longer than the board's stall threshold, and carries no raised flag
    kind: condition
    unattended: true
    entities:
      - { entity: board, effect: reads, facts: [Stall threshold] }
      - { entity: card, effect: reads, facts: [Column, Entered column at] }
      - { entity: column, effect: reads, facts: [Position] }
  - text: The Product raises a stall flag on the card naming its column and how long it has been there
    kind: product
    entities:
      - { entity: stall-flag, effect: creates, to: Raised, facts: [Reason, Raised at] }
      - { entity: card, effect: reads, facts: [] }
      - { entity: column, effect: reads, facts: [Name] }
    contexts:
      web:
        place: board-web::board
---

# Flag a card past the stall threshold

## Trigger

The Product's own check finds a card that has stayed in one column longer than its board's stall threshold.

## Outcome

The card carries a raised stall flag that every member of the board sees on the board and on the card, and nothing about the card itself has changed.

## Edge cases

- The card is in the board's last column → no flag; finished work does not stall.
- The card already carries a raised stall flag → no second flag is raised.
