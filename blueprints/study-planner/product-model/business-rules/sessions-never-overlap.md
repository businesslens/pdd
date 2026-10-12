---
appliesTo:
  - type: entity
    id: study-session
    facts: [Start, Planned minutes]
  - type: entity
    id: study-plan
    facts: [Proposed sessions]
---

# Sessions never overlap

No two study sessions in a Student's schedule share any time, across all of the
Student's goals. Scheduling or moving a session onto time another session holds
is refused, and no study plan proposes a session over one it does not replace.
A plan is checked again when accepted: if a session of another goal now holds
time it proposes, it is refused and becomes outdated.

## Rationale

A Student can study only one thing at a time; overlapping sessions would
promise study that cannot happen.
