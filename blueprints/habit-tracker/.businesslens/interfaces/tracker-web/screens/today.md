---
entities:
  - { entity: habit, shows: [Name, Schedule, Current streak] }
  - { entity: check-in, shows: [Day] }
entryPoints:
  - tracker-web: /today
---

# Today

Lists the active habits due today with their current streak and whether each
has been checked off today, and lets the Owner check one off or uncheck it. A habit kept a number of times each week is listed every day
of the week, with how many of its times are done, until its target is met.
