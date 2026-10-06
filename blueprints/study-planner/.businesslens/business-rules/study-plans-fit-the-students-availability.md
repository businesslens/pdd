---
appliesTo:
  - type: entity
    id: study-plan
    facts: [Proposed sessions, Shortfall]
---

# Study plans fit the Student's availability

Every proposed session falls inside the Student's weekly availability, after
the moment the plan is prepared and before the goal's target date. Study that
does not fit is reported as the plan's shortfall, never squeezed in outside
that time; the Product refuses an agent's plan with a session that does not
fit.

## Rationale

A plan the Student cannot keep is worse than an honest one that falls short:
the shortfall tells the Student to add time or lower an estimate.
