---
kind: edge
result: not-achieved
routes:
  web: Web
steps:
  - text: The Student picks a goal, confirms their weekly availability and asks for a plan
    kind: actor
    actor: student
    capability: propose-study-plan
    entities:
      - { entity: goal, effect: reads, facts: [Name] }
      - { entity: student, facts: [Weekly availability] }
    contexts:
      web:
        place: planner-web::plans
  - text: The Planning assistant proposes a plan that divides the study still to do across that availability
    kind: actor
    actor: planning-assistant
    capability: propose-study-plan
    entities:
      - { entity: study-plan, effect: creates, to: Proposed, facts: [Proposed sessions, Replaced sessions, Explanation, Shortfall, Prepared at] }
      - { entity: student, effect: reads, facts: [] }
  - text: The Product opens the proposed plan for review
    kind: product
    actor: student
    capability: propose-study-plan
    entities:
      - { entity: study-plan, effect: reads, facts: [Proposed sessions, Replaced sessions, Explanation, Shortfall, Prepared at] }
      - { entity: goal, effect: reads, facts: [Name, Target date] }
    contexts:
      web:
        place: planner-web::plan-review
  - text: The Student declines the plan
    kind: actor
    actor: student
    capability: decline-study-plan
    entities:
      - { entity: study-plan, from: Proposed, to: Declined, facts: [] }
    contexts:
      web:
        place: planner-web::plan-review
---

# Decline the plan for a goal

## Trigger

The Student asks for a plan and does not like what is proposed.

## Outcome

The Journey goal is not achieved: the plan is declined and the schedule is as it was.
