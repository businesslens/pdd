---
kind: edge
routes:
  web: Web
steps:
  - text: The Student asks the planner to plan a goal that needs more study than their availability holds before its date
    kind: actor
    actor: student
    entities:
      - { entity: goal, effect: reads, facts: [Target date] }
    contexts:
      web:
        place: planner-web::goal-detail
  - text: The study still to do needs more hours than the Student's availability holds before the target date
    kind: condition
    actor: student
    entities:
      - { entity: topic, effect: reads, facts: [Estimated hours] }
      - { entity: student, effect: reads, facts: [Weekly availability] }
    contexts:
      web:
        place: planner-web::goal-detail
  - text: The Product fills the available time and keeps the plan with the hours that do not fit as its shortfall
    kind: product
    actor: student
    entities:
      - { entity: study-plan, effect: creates, to: Proposed, facts: [Proposed sessions, Replaced sessions, Explanation, Shortfall, Prepared by, Prepared at] }
    contexts:
      web:
        place: planner-web::goal-detail
  - text: The Product opens the plan for review, with its shortfall and the topics it belongs to
    kind: product
    actor: student
    entities:
      - { entity: topic, effect: reads, facts: [Name] }
      - { entity: study-plan, effect: reads, facts: [Proposed sessions, Shortfall] }
    contexts:
      web:
        place: planner-web::plan-review
---

# Build a plan that falls short

## Trigger

The Student asks for a plan for a goal whose topics need more hours than the time before its date allows.

## Outcome

The plan uses the available time, says how many hours do not fit and which topics they belong to, and schedules nothing outside the availability.
