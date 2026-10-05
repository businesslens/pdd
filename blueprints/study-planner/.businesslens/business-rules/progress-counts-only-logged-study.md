---
appliesTo:
  - type: capability
    id: view-goal-progress
  - type: entity
    id: study-session
    effect: reads
    facts: [Logged minutes]
---

# Progress counts only logged study

A goal's progress is the study logged for it: each topic's logged hours
against its estimate, and the goal's logged hours against the hours its topics
need. Planned sessions, missed sessions and accepted plans add nothing until
study is logged.

## Rationale

Progress has to reflect study that happened, or a full schedule would look
like a goal well on its way.
