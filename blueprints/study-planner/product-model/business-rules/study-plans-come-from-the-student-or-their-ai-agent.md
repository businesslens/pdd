---
appliesTo:
  - type: entity
    id: study-plan
    effect: creates
permits:
  - related: [{ verb: is planned in, entity: goal }, { verb: owns, entity: student }]
  - related: [{ verb: is planned in, entity: goal }, { verb: owns, entity: student }, { verb: connects, entity: ai-agent }]
---

# Study plans come from the Student or their AI agent

A study plan for a goal is built by the planner when the Student who owns the goal asks for one, or left by an AI agent that Student connected.

## Rationale

A plan proposes changes to one Student's schedule, so it comes only from that Student's request or from the agent they chose to connect.
