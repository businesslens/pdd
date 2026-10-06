---
appliesTo:
  - type: entity
    id: proposed-card
    effect: removes
permits:
  - related: [{ verb: receives, entity: board }, { verb: has, entity: board-membership }, { verb: holds, entity: teammate }]
    when: [{ entity: board-membership, fact: Role, is: Admin }]
---

# Proposed cards are deleted only with their board

A proposed card, decided or not, is deleted only together with its board, when
an admin deletes the board. A dismissed proposal is kept as dismissed, not
deleted.

## Rationale

The board's proposals record what was suggested to the team and what the team
decided; they last as long as the board does.
