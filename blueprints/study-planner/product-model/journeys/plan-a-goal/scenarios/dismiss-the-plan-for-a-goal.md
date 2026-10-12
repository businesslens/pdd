---
kind: edge
result: not-achieved
routes:
  web: Web
steps:
  - text: The Student asks the planner to plan the goal
    kind: actor
    actor: student
    capability: build-study-plan
    entities:
      - { entity: goal, effect: reads, facts: [Name, Target date] }
    contexts:
      web:
        place: planner-web::goal-detail
  - text: The Product spreads each topic's study still to do across the Student's weekly availability and keeps the plan
    kind: product
    actor: student
    capability: build-study-plan
    entities:
      - { entity: topic, effect: reads, facts: [Estimated hours] }
      - { entity: student, effect: reads, facts: [Weekly availability] }
      - { entity: study-plan, effect: creates, to: Proposed, facts: [Proposed sessions, Replaced sessions, Explanation, Prepared by, Prepared at] }
    contexts:
      web:
        place: planner-web::goal-detail
  - text: The Product opens the plan for review
    kind: product
    actor: student
    capability: build-study-plan
    entities:
      - { entity: study-plan, effect: reads, facts: [Proposed sessions, Replaced sessions, Explanation] }
    contexts:
      web:
        place: planner-web::plan-review
  - text: The Student reviews the plan and dismisses it
    kind: actor
    actor: student
    capability: dismiss-study-plan
    entities:
      - { entity: study-plan, from: Proposed, to: Dismissed, facts: [] }
    contexts:
      web:
        place: planner-web::plan-review
---

# Dismiss the plan for a goal

## Trigger

The Student asks the planner to plan a goal and does not like what it builds.

## Outcome

The Journey goal is not achieved: the plan is dismissed and the schedule is as it was.
