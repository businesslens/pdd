---
appliesTo:
  - type: entity
    id: habit
    effect: reads
    facts: [Current streak, Best streak]
---

# A streak counts scheduled periods in a row

A habit's current streak is the number of its scheduled periods, up to the
latest one, that were done without a miss in between. For a habit due every
day or on chosen weekdays, a period is a scheduled day, and days it is not due
are skipped. For a habit kept a number of times each week, a period is a
calendar week whose target was met. Paused days neither extend nor break a
streak, and the period in progress — today, or this week — breaks nothing
until it is over. The best streak is the longest current streak the habit has
reached.

## Rationale

The Owner chose the schedule. Counting anything else would mark a rest day, or
a planned break, as a failure.
