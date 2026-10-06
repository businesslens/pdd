---
appliesTo:
  - type: entity
    id: topic
    effect: removes
permits:
  - related: [{ verb: covers, entity: goal }, { verb: owns, entity: student }]
---

# Only the Student removes their topics

A topic is removed only by the Student who owns its goal.

## Rationale

Removing a topic cancels its upcoming sessions, which only the Student may decide.
