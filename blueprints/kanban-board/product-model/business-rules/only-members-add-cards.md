---
appliesTo:
  - type: entity
    id: card
    effect: creates
permits:
  - related: [{ verb: holds, entity: column }, { verb: contains, entity: board }, { verb: has, entity: board-membership }, { verb: holds, entity: teammate }]
---

# Only the board's members add cards to it

A card is added to a board only by a Teammate who is a member of that board, directly or by accepting a proposed card. An AI agent never adds one.

## Rationale

The board is the team's record of what it has committed to and where each
piece of work stands. It stays trustworthy only while every change on it is a
member's own decision.
