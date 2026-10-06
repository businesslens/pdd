---
appliesTo:
  - type: entity
    id: card
    effect: reads
permits:
  - related: [{ verb: holds, entity: column }, { verb: contains, entity: board }, { verb: has, entity: board-membership }, { verb: holds, entity: teammate }]
  - related: [{ verb: holds, entity: column }, { verb: contains, entity: board }, { verb: has, entity: board-membership }, { verb: holds, entity: teammate }, { verb: connects, entity: ai-agent }]
  - unattended: true
---

# Only members and their AI agents see a board's cards

A board's cards, with everything they say, are seen only by the Teammates who
are members of the board, by an AI agent a member has connected, and by the
Product's own check for stalled cards. Anyone else cannot see them.

## Rationale

The cards are the team's unfinished plans and who is doing what; they are
shared only with the people the team added, like the board itself.
