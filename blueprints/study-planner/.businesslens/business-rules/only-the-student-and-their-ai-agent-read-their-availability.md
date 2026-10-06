---
appliesTo:
  - type: entity
    id: student
    effect: reads
    facts: [Weekly availability]
permits:
  - self: true
  - related: [{ verb: connects, entity: ai-agent }]
---

# Only the Student and their AI agent read their availability

A Student's weekly availability is read only by that Student and by an AI agent
they connected.

## Rationale

The planner is private: connecting an agent is the Student's consent for it to
read, and nobody else has any.
