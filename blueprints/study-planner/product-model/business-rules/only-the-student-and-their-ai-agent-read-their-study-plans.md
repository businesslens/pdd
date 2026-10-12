---
appliesTo:
  - type: entity
    id: study-plan
    effect: reads
permits:
  - related: [{ verb: is planned in, entity: goal }, { verb: owns, entity: student }]
  - related: [{ verb: is planned in, entity: goal }, { verb: owns, entity: student }, { verb: connects, entity: ai-agent }]
---

# Only the Student and their AI agent read their study plans

A study plan is read only by the Student who owns its goal and by an AI agent that Student connected.

## Rationale

The planner is private: connecting an agent is the Student's consent for it to read, and nobody else has any.
