---
appliesTo:
  - type: entity
    id: topic
    effect: reads
permits:
  - related: [{ verb: covers, entity: goal }, { verb: owns, entity: student }]
  - related: [{ verb: covers, entity: goal }, { verb: owns, entity: student }, { verb: connects, entity: ai-agent }]
---

# Only the Student and their AI agent read their topics

A topic is read only by the Student who owns its goal and by an AI agent that Student connected.

## Rationale

The planner is private: connecting an agent is the Student's consent for it to read, and nobody else has any.
