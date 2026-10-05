---
appliesTo:
  - type: entity
    id: note
    effect: creates
  - type: entity
    id: note
    effect: changes
  - type: entity
    id: note
    effect: removes
permits:
  - actors: [owner]
---

# Only the owner creates, changes or deletes a note

Every note is written, filed, tagged, linked and deleted by its Owner. An AI
agent never changes a note: what it proposes is applied only when the Owner
accepts it, and then as the Owner's own change.

## Rationale

An agent's reading of a note can be wrong. Keeping every change behind the
Owner's decision means a wrong suggestion costs a dismissal, never a lost or
misplaced note.
