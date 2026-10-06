---
appliesTo:
  - type: entity
    id: check-in
    effect: creates
---

# Only today and the six days before it can be checked off

A check-in is recorded for today or one of the six days before it, and never for
a day still to come. A habit has at most one check-in for each day, and none for
a day before it started.

A day runs from midnight to midnight in the Owner's current time zone, and so
does each week a reflection looks back on. After the Owner moves, today is the
day where they now are; check-ins already recorded keep their days.

## Rationale

The past week is long enough to fix a forgotten check-off and short enough that
a history cannot be filled in after the fact.
