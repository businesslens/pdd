---
appliesTo:
  - type: entity
    id: goal
    effect: creates
permits:
  - related: [{ verb: owns, entity: student }]
---

# Only the Student creates their goals

A goal is created only by the Student whose planner it is in. The AI agent never starts a goal.

## Rationale

A goal is the Student's statement of what they must study and by when; everything else in the planner works back from it.
