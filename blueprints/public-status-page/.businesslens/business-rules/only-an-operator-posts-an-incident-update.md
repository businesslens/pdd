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
Operator posts it. The Drafting assistant prepares drafts and nothing more:
it never posts one, whatever it was asked.

## Rationale

Visitors and subscribers act on what the page says. Every published word must
be one an Operator read and chose to send.
