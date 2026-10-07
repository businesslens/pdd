---
kind: primary
result: achieved
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
  - text: The Student reviews the proposed sessions and the explanation, and accepts the plan
    kind: actor
    actor: student
    capability: accept-study-plan
    entities:
      - { entity: study-plan, effect: reads, facts: [Proposed sessions, Replaced sessions, Explanation] }
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

# Build and accept a plan for a goal

## Trigger

The Student has a goal with topics and asks the planner to plan it.

## Outcome

The Journey goal is achieved: the goal's upcoming sessions are the accepted plan's.
