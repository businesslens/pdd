---
appliesTo:
  - type: entity
    id: card
    effect: changes
permits:
  - related: [{ verb: holds, entity: column }, { verb: contains, entity: board }, { verb: has, entity: board-membership }, { verb: holds, entity: teammate }]
---

# Only the board's members change its cards

A card's details and its place on the board are changed only by a Teammate who is a member of that board. An AI agent never edits or moves one.

## Rationale

The board is the team's record of what it has committed to and where each
piece of work stands. It stays trustworthy only while every change on it is a
member's own decision.
