---
appliesTo:
  - { type: entity, id: filing-suggestion, effect: changes }
  - { type: entity, id: duplicate-suggestion, effect: changes }
permits:
  - actors: [owner]
---

# Only the Owner decides a suggestion

A suggestion is accepted, merged, declined or withdrawn only through the
Owner's own decision about it. The assistant cannot accept its own
suggestions, change one after preparing it, or take one back.

## Rationale

The approval is the point of a suggestion. A suggestion its author could decide
would be a change made on the Owner's behalf without asking.
