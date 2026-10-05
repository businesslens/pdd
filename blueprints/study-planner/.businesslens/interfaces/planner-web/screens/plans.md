---
entities:
  - { entity: study-plan, shows: [Prepared at] }
  - { entity: goal, shows: [Name] }
  - { entity: student, shows: [Weekly availability], collects: [Weekly availability] }
entryPoints:
  - planner-web: /plans
---

# Plans

Lists the study plans waiting for the Student's review, each with its goal and
when it was left, and keeps the weekly availability every plan is built
around.
