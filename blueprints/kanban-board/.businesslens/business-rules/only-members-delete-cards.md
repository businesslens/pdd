---
appliesTo:
  - type: entity
    id: card
    effect: removes
permits:
  - related: [{ verb: holds, entity: column }, { verb: contains, entity: board }, { verb: has, entity: board-membership }, { verb: holds, entity: teammate }]
---

# Only the board's members delete its cards

A card is deleted only by a Teammate who is a member of its board. An AI agent never deletes one.

## Rationale

The board is the team's record of what it has committed to and where each
piece of work stands. It stays trustworthy only while every change on it is a
member's own decision.
