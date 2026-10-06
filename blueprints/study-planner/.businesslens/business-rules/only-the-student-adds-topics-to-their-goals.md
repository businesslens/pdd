---
appliesTo:
  - type: entity
    id: topic
    effect: creates
permits:
  - related: [{ verb: covers, entity: goal }, { verb: owns, entity: student }]
---

# Only the Student adds topics to their goals

Topics are added only by the Student who owns the goal. The AI agent never adds a topic.

## Rationale

The topics are the Student's own breakdown of what to study; a plan divides them, it does not add to them.
