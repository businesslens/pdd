---
appliesTo:
  - type: entity
    id: topic
    effect: removes
permits:
  - related: [{ verb: covers, entity: goal }, { verb: owns, entity: student }]
---

# Only the Student removes their topics

A topic, with its planned and logged sessions, is removed only by the Student who owns its goal. The AI agent never removes a topic.

## Rationale

Removing a topic takes its study record with it for good, which only the Student may decide.
