---
appliesTo:
  - { type: entity, id: filing-suggestion, effect: creates }
  - { type: entity, id: duplicate-suggestion, effect: creates }
permits:
  - actors: [ai-agent]
---

# Suggestions come only from the AI agent

Only an AI agent the Owner connected leaves a suggestion. The Owner changes the
library directly and has no need to suggest anything to themselves.

## Rationale

Suggestions are the one thing the AI agent may create, which keeps everything
it does in one place the Owner reviews.
