---
entities:
  - { entity: habit, shows: [Name, Schedule], collects: [Name, Schedule] }
entryPoints:
  - tracker-mobile: habit-tracker://habits/new
---

# New habit

Takes the Owner through defining a habit: what it is called and when it is
due — every day, on chosen weekdays, or a number of times each week. The Owner
can leave before saving without a habit being created.
