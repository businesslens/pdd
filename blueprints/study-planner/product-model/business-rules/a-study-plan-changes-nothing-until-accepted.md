---
appliesTo:
  - type: entity
    id: study-plan
---

# A study plan changes nothing until accepted

A study plan, whether the planner built it or the AI agent left it, changes no
session while it is proposed, and none once it is dismissed or outdated. Only
accepting it puts its sessions in the schedule.

## Rationale

The Student has to be able to read any plan, including a poor one, without
risk; the schedule stays theirs until they say otherwise.
