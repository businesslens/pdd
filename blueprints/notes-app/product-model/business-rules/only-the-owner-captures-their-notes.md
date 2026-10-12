---
appliesTo:
  - { type: entity, id: note, effect: creates }
permits:
  - related: [{ verb: keeps, entity: owner }]
---

# Only the owner captures their notes

A note is written into the inbox only by the Owner who will keep it. An AI agent
never creates a note.

## Rationale

Every note in the inbox is something the Owner chose to write down, so emptying it
is always the Owner's own work.
