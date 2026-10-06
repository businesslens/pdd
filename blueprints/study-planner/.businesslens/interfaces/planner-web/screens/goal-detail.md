---
entities:
  - { entity: goal, shows: [Name, Target date], collects: [Name, Target date] }
  - { entity: topic, shows: [Name, Estimated hours], collects: [Name, Estimated hours] }
  - { entity: study-session, shows: [Logged minutes] }
entryPoints:
  - planner-web: /goals/:goalId
---

# Goal detail

Presents one goal: its name and target date, the topics it is broken into with
their estimates, and how many hours have been logged against each. This is
where the Student changes or deletes the goal, adds, changes and removes
topics, reads the goal's progress, and asks for a study plan.
