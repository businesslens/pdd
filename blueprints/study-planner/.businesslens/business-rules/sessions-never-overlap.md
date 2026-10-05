---
appliesTo:
  - type: capability
    id: add-study-session
  - type: capability
    id: move-study-session
  - type: capability
    id: propose-study-plan
---

# Sessions never overlap

No two study sessions in a Student's schedule share any time, across all of the
Student's goals. Scheduling or moving a session onto time another session holds
is refused, and a study plan never proposes a session over one it does not
replace.

## Rationale

A Student can study only one thing at a time; overlapping sessions would
promise study that cannot happen.
