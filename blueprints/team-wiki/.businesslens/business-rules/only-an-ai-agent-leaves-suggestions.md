---
appliesTo:
  - type: entity
    id: suggestion
    effect: creates
permits:
  - actors: [ai-agent]
---

# Only an AI agent leaves suggestions

A suggestion comes from an AI agent's review of a space a Member it acts for
belongs to. Members change pages directly; they do not leave suggestions for one
another.

## Rationale

Suggestions bring an agent's help to a space while keeping its proposals apart
from the Editors' own work, so everyone can tell which is which.
