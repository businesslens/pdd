---
appliesTo:
  - type: entity
    id: study-plan
    facts: [Replaced sessions]
---

# A plan replaces only upcoming planned sessions

A study plan replaces only its goal's planned sessions that have not yet
started. Logged sessions, missed sessions and the sessions of other goals stay
exactly as they were when it is accepted.

## Rationale

Logged and missed sessions are the record of what actually happened. A new
plan changes what comes next, never the history progress is counted from.
