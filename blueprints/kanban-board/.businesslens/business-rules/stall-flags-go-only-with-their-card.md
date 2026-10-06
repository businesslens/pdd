---
appliesTo:
  - type: entity
    id: stall-flag
    effect: removes
permits:
  - related: [{ verb: carries, entity: card }, { verb: holds, entity: column }, { verb: contains, entity: board }, { verb: has, entity: board-membership }, { verb: holds, entity: teammate }]
    when: [{ entity: board-membership, fact: Role, is: Admin }]
---

# Stall flags are deleted only with their card

A stall flag, raised or cleared, is deleted only together with its card, when an
admin of the board deletes the card or the board.

## Rationale

A flag is part of the card's history on the board; it lasts exactly as long as
the card does.
