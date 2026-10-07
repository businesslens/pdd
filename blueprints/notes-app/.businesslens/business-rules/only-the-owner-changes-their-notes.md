---
appliesTo:
  - { type: entity, id: note, effect: changes }
permits:
  - related: [{ verb: keeps, entity: owner }]
---

# Only the owner changes their notes

A note's words, links, tags and notebook are changed only by the Owner who keeps
it. What an AI agent proposes is applied only when the Owner accepts it, and
then as the Owner's own change.

## Rationale

An agent's reading of a note can be wrong. Keeping every change behind the
Owner's decision means a wrong suggestion costs a dismissal, never a misplaced
note.
