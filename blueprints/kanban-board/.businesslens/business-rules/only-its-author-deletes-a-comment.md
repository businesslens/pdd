---
appliesTo:
  - type: entity
    id: comment
    effect: removes
permits:
  - related: [{ verb: writes, entity: teammate }]
  - related: [{ verb: has, entity: card }, { verb: holds, entity: column }, { verb: contains, entity: board }, { verb: has, entity: board-membership }, { verb: holds, entity: teammate }]
---

# Only its author deletes a comment on its own

A comment is deleted on its own only by the Teammate who wrote it. A member of
the board who deletes a card, or an admin who deletes the board, deletes every
comment on it too, whoever wrote them; that is the only way a comment goes
without its author.

## Rationale

A comment is someone's own words; nobody else takes them back on their behalf.
A comment on work the team has dropped has nothing left to belong to.
