---
appliesTo:
  - { type: entity, id: tag, effect: creates }
permits:
  - related: [{ verb: keeps, entity: owner }]
---

# Only the owner adds their tags

A tag comes into being only through a change the Owner who keeps it makes:
saving a note with a new tag, or accepting a suggestion that names one. An AI
agent may propose a new tag, but it exists only once the Owner accepts.

## Rationale

The Owner's tags are their own vocabulary; it grows only by their decision.
