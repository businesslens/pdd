---
appliesTo:
  - { type: entity, id: duplicate-suggestion, effect: creates }
permits:
  - related: [{ verb: groups, entity: bookmark }, { verb: owns, entity: owner }, { verb: connects, entity: ai-agent }]
---

# A duplicate suggestion comes only from the Owner's AI agent

Only the AI agent an Owner connected leaves a duplicate suggestion, and only
about that Owner's bookmarks.

## Rationale

Spotting the same page under different addresses needs judgment the Product
leaves to the agent, and the decision to the Owner.
