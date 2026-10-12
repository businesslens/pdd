---
appliesTo:
  - type: entity
    id: study-session
    effect: creates
permits:
  - related: [{ verb: is studied in, entity: topic }, { verb: covers, entity: goal }, { verb: owns, entity: student }]
---

# Only the Student schedules their sessions

A study session is added to the schedule only by the Student, directly, by logging unplanned study, or by accepting a study plan. The AI agent never adds a session.

## Rationale

The schedule is the Student's commitment of their own time; an agent that could fill it unasked would make the planner something to check up on.
