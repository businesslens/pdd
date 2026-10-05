---
entities:
  - { entity: study-session, shows: [Start, Planned minutes, Logged minutes, Notes], collects: [Start, Planned minutes, Logged minutes, Notes] }
  - { entity: topic, shows: [Name] }
  - { entity: goal, shows: [Name] }
entryPoints:
  - planner-web: /schedule
---

# Schedule

Presents the Student's study sessions over time, each with its topic and goal,
when it starts and how long it is planned for, and whether it was logged or
missed. This is where the Student schedules, moves, cancels and logs sessions.
