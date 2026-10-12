---
appliesTo:
  - type: entity
    id: stall-flag
    effect: changes
permits:
  - related: [{ verb: carries, entity: card }, { verb: holds, entity: column }, { verb: contains, entity: board }, { verb: has, entity: board-membership }, { verb: holds, entity: teammate }]
---

# A stall flag clears only when a member moves its card

A raised stall flag is cleared by the Product only when a member of the board
moves its card to another column. Nobody clears a flag by hand, and moving the
card within its column leaves the flag raised.

## Rationale

The flag says the work has not moved. Only moving the work makes that untrue.
