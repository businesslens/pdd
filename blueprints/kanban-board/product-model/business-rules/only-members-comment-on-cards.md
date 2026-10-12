---
appliesTo:
  - type: entity
    id: comment
    effect: creates
permits:
  - related: [{ verb: has, entity: card }, { verb: holds, entity: column }, { verb: contains, entity: board }, { verb: has, entity: board-membership }, { verb: holds, entity: teammate }]
---

# Only the board's members comment on its cards

A comment is posted on a card only by a Teammate who is a member of the card's
board.

## Rationale

Comments are the team's conversation about its own work, read by everyone on
the board.
