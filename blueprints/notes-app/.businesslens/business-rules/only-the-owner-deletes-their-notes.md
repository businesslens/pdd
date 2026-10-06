---
appliesTo:
  - { type: entity, id: note, effect: removes }
permits:
  - related: [{ verb: keeps, entity: owner }]
---

# Only the owner deletes their notes

A note is deleted only by the Owner who keeps it, and only after they confirm.
An AI agent never deletes a note.

## Rationale

Deleting a note is for good, so it is never anyone's decision but the Owner's.
