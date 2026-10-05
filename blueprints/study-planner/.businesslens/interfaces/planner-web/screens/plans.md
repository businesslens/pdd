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
when it was prepared, and is where the Student asks the Planning assistant to
plan a goal around their weekly availability.
