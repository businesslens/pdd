---
entities:
  - { entity: habit, shows: [Name, Schedule, Started on, Current streak, Best streak], collects: [Name, Schedule] }
  - { entity: check-in, shows: [Day] }
entryPoints:
  - tracker-web: /habits/:habitId
---

# Habit detail

One habit, opened to work with. It presents the habit's name and schedule, the
day it started, whether it is active or paused, its current and best streak,
and the history of days it was done. Here the Owner changes its name or
schedule, checks off or takes back a day from the past week, pauses or resumes
it, and deletes it.
