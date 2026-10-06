---
appliesTo:
  - type: entity
    id: topic
    effect: changes
permits:
  - related: [{ verb: covers, entity: goal }, { verb: owns, entity: student }]
---

# Only the Student changes their topics

A topic's name and estimate are changed only by the Student who owns its goal. The AI agent never adjusts an estimate to make a plan fit.

## Rationale

Estimates are the Student's statement of how much study a topic needs; a plan that changed them would hide its shortfall.
