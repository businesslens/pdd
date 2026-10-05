---
appliesTo:
  - type: entity
    id: card
    effect: changes
    facts: [Assignees]
---

# A card's assignees are members of its board

Only members of a board can be assigned to its cards. A Teammate who stops
being a member is unassigned from every card on that board.

## Rationale

An assignee who cannot open the board cannot do the work, and would leave the
card looking covered when it is not.
