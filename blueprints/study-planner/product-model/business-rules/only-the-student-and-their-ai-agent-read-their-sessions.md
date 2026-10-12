---
appliesTo:
  - type: entity
    id: study-session
    effect: reads
permits:
  - related: [{ verb: is studied in, entity: topic }, { verb: covers, entity: goal }, { verb: owns, entity: student }]
  - related: [{ verb: is studied in, entity: topic }, { verb: covers, entity: goal }, { verb: owns, entity: student }, { verb: connects, entity: ai-agent }]
---

# Only the Student and their AI agent read their sessions

A study session is read only by the Student who owns its goal and by an AI agent that Student connected.

## Rationale

The planner is private: connecting an agent is the Student's consent for it to read, and nobody else has any.
