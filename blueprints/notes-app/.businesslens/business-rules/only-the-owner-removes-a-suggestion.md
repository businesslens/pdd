---
appliesTo:
  - { type: entity, id: suggestion, effect: removes }
permits:
  - related: [{ verb: receives, entity: note }, { verb: keeps, entity: owner }]
---

# Only the owner removes a suggestion

A proposed suggestion goes away only when the Owner who keeps its note deletes
that note, after confirming. The AI agent that left it cannot withdraw it.

## Rationale

Every suggestion an agent leaves reaches the Owner, so nothing it proposed
disappears without the Owner seeing it or deleting the note it was for.
