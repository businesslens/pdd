---
appliesTo:
  - type: entity
    id: comment
    effect: removes
permits:
  - related: [{ verb: writes, entity: teammate }]
---

# Only its author deletes a comment on its own

A comment is deleted on its own only by the Teammate who wrote it. When its
card goes, by a member deleting the card or an admin deleting the board, every
comment on the card goes with it, whoever wrote them.

## Rationale

A comment is someone's own words; nobody else takes them back on their behalf.
A comment on work the team has dropped has nothing left to belong to.
