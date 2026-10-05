---
appliesTo:
  - type: entity
    id: stall-flag
---

# A card is flagged only past its board's stall threshold

A stall flag is raised only on a card that has stayed in one column, other than
its board's last, for longer than the board's stall threshold, and a card
carries at most one raised flag. Moving the card to another column clears the
flag and starts the count again.

## Rationale

A flag asks the team to look at a card. Raised early, or on finished work, it
would teach members to ignore it.
