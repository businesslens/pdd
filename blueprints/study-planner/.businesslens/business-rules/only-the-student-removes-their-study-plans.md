---
appliesTo:
  - type: entity
    id: study-plan
    effect: removes
permits:
  - related: [{ verb: is planned in, entity: goal }, { verb: owns, entity: student }]
---

# Only the Student removes their study plans

A study plan is removed only when the Student who owns its goal deletes that goal.

## Rationale

Plans are the record of what was proposed and decided for a goal, and go only with it.
