---
appliesTo:
  - type: entity
    id: study-session
    effect: removes
permits:
  - related: [{ verb: is studied in, entity: topic }, { verb: covers, entity: goal }, { verb: owns, entity: student }]
---

# Only the Student removes their sessions

A study session leaves the schedule only by the Student's act: cancelling it, accepting a plan that replaces it, removing its topic or deleting its goal. The AI agent never removes a session.

## Rationale

The schedule is the Student's commitment of their own time, so only the Student takes anything out of it.
