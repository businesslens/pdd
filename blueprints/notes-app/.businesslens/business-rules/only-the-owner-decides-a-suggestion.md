---
appliesTo:
  - type: entity
    id: suggestion
    effect: changes
permits:
  - actors: [owner]
---

# Only the owner decides a suggestion

Only the Owner accepts or dismisses a suggestion, and a decided suggestion is
never decided again. The AI agent that left it cannot accept, withdraw or
change it.

## Rationale

Acceptance is the single point where an agent's proposal becomes a change to a
note, so it belongs to the person whose note it is.
