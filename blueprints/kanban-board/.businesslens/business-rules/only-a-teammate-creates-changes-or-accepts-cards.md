---
appliesTo:
  - type: entity
    id: card
    effect: creates
  - type: entity
    id: card
    effect: changes
  - type: entity
    id: proposed-card
    effect: changes
permits:
  - actors: [teammate]
---

# Only a Teammate creates, changes or accepts cards

Every card on a board is created, edited and moved by a Teammate, and every
proposed card is accepted or dismissed by one. The AI agent proposes cards and
flags stalled ones, but it never puts a card on the board, changes or moves a
card, or decides on its own proposals.

## Rationale

The board is the team's record of what it has committed to and where each
piece of work stands. It stays trustworthy only while every change on it is a
member's own decision.
