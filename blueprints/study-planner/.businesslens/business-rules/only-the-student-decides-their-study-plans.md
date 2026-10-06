---
appliesTo:
  - type: entity
    id: study-plan
    effect: changes
permits:
  - related: [{ verb: is planned in, entity: goal }, { verb: owns, entity: student }]
---

# Only the Student decides their study plans

A proposed plan waits until the Student who owns its goal accepts or dismisses it. The AI agent never accepts or dismisses a plan, its own or the planner's.

## Rationale

Accepting a plan replaces upcoming sessions, the one consequential thing a plan can do; that decision is the Student's alone.
