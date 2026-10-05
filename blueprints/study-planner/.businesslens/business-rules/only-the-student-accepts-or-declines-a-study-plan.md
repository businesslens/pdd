---
appliesTo:
  - type: entity
    id: study-plan
    effect: changes
    to: Accepted
  - type: entity
    id: study-plan
    effect: changes
    to: Declined
permits:
  - actors: [student]
---

# Only the Student accepts or declines a study plan

A proposed plan waits until the Student accepts or declines it. The AI agent
never accepts its own plan, and a plan nobody decides on never
changes the schedule.

## Rationale

Accepting a plan replaces upcoming sessions, which is the one consequential
thing a plan can do; that decision is the Student's alone.
