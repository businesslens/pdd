---
appliesTo:
  - type: entity
    id: suggestion
    effect: creates
permits:
  - related: [{ verb: receives, entity: note }, { verb: keeps, entity: owner }, { verb: connects, entity: ai-agent }]
---

# Only their AI agent leaves suggestions

A suggestion for a note is left only by an AI agent the Owner who keeps that
note has connected. The Owner never writes suggestions; they decide them.

## Rationale

Suggestions exist to bring an agent's help to the Owner's notes, and only the
agent the Owner chose may offer it.
