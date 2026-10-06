---
entities:
  - { entity: study-plan, shows: [Prepared by, Prepared at] }
  - { entity: goal, shows: [Name] }
  - { entity: student, shows: [Weekly availability], collects: [Weekly availability] }
entryPoints:
  - planner-web: /plans
---

# Plans

Lists the study plans waiting for the Student's review, each with its goal,
who prepared it and when, and keeps the weekly availability every plan is built
around.
