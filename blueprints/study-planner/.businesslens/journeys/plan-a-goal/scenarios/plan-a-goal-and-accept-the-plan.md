---
kind: primary
result: achieved
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
  - text: The Student accepts the plan
    kind: actor
    actor: student
    capability: accept-study-plan
    entities: []
    contexts:
      web:
        place: planner-web::plan-review
  - text: The Product replaces the goal's upcoming planned sessions with the plan's sessions
    kind: product
    actor: student
    capability: accept-study-plan
    entities:
      - { entity: study-session, as: replaced, effect: removes, from: Planned }
      - { entity: study-session, as: proposed, effect: creates, to: Planned, facts: [Start, Planned minutes] }
      - { entity: goal, effect: reads, facts: [] }
    contexts:
      web:
        place: planner-web::plan-review
  - text: The Product marks the plan accepted
    kind: product
    actor: student
    capability: accept-study-plan
    entities:
      - { entity: study-plan, from: Proposed, to: Accepted, facts: [] }
    contexts:
      web:
        place: planner-web::plan-review
---

# Plan a goal and accept the plan

## Trigger

The Student has a goal with topics and wants the planner to schedule it.

## Outcome

The Journey goal is achieved: the goal's upcoming sessions are the accepted plan's.
