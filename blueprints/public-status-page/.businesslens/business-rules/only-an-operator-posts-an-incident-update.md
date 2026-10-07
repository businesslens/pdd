---
appliesTo:
  - type: entity
    id: incident-update
    effect: creates
permits:
  - actors: [operator]
---

# Only an Operator posts an incident update

An incident update reaches the public timeline and subscribers only when an
Operator posts it. Text a language model drafted is only the update being
written until an Operator reads it and posts it.

## Rationale

Visitors and subscribers act on what the page says. Every published word must
be one an Operator read and chose to send.
