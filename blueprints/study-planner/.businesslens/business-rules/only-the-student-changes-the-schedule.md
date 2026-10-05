---
appliesTo:
  - type: entity
    id: study-session
    effect: creates
  - type: entity
    id: study-session
    effect: changes
  - type: entity
    id: study-session
    effect: removes
permits:
  - actors: [student]
---

# Only the Student changes the schedule

Study sessions are scheduled, moved, logged and cancelled only by the Student,
directly or by accepting a study plan. The Planning assistant reads the
schedule and proposes; it never adds, moves, logs or removes a session itself.

## Rationale

The schedule is the Student's commitment of their own time. An assistant that
could rearrange it unasked would make the planner something the Student has to
check up on rather than rely on.
