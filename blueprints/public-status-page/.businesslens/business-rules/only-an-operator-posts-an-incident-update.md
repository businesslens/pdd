---
appliesTo:
  - type: entity
    id: incident-update
    effect: creates
    to: Posted
  - type: entity
    id: incident-update
    effect: changes
    to: Posted
permits:
  - actors: [operator]
---

# Only an Operator posts an incident update

An incident update reaches the public timeline and subscribers only when an
Operator posts it. A draft the Product prepared with a language model is only a
proposal: it stays a draft until an Operator reads it and posts it.

## Rationale

Visitors and subscribers act on what the page says. Every published word must
be one an Operator read and chose to send.
