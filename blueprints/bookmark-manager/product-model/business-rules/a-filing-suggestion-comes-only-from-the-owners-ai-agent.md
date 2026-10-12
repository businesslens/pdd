---
appliesTo:
  - { type: entity, id: filing-suggestion, effect: creates }
permits:
  - related: [{ verb: covers, entity: bookmark }, { verb: owns, entity: owner }, { verb: connects, entity: ai-agent }]
---

# A filing suggestion comes only from the Owner's AI agent

Only the AI agent an Owner connected leaves a filing suggestion, and only about
that Owner's bookmarks. The Owner files bookmarks directly and has no need to
suggest anything to themselves.

## Rationale

Suggestions are the one thing the AI agent may create, which keeps everything
it does in one place the Owner reviews.
