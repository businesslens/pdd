---
appliesTo:
  - type: entity
    id: suggestion
    effect: creates
permits:
  - related: [{ verb: receives, entity: page }, { verb: contains, entity: space }, { verb: has, entity: space-membership }, { verb: holds, entity: member }, { verb: connects, entity: ai-agent }]
---

# Only a space's Members' AI agents leave suggestions there

A suggestion for a page is left only by an AI agent that a Member of the page's
space connected. Members change pages directly; they do not leave suggestions
for one another.

## Rationale

Suggestions bring an agent's help to a space while keeping its proposals apart
from the Editors' own work, so everyone can tell which is which.
