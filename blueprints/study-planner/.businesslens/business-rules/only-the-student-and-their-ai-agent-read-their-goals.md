---
appliesTo:
  - type: entity
    id: goal
    effect: reads
permits:
  - related: [{ verb: owns, entity: student }]
  - related: [{ verb: owns, entity: student }, { verb: connects, entity: ai-agent }]
---

# Only the Student and their AI agent read their goals

A goal is read only by the Student who owns it and by an AI agent that Student connected.

## Rationale

The planner is private: connecting an agent is the Student's consent for it to read, and nobody else has any.
