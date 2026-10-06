---
kind: primary
routes:
  web: Web
steps:
  - text: The Student asks the planner to plan the goal
    kind: actor
    actor: student
    entities:
      - { entity: goal, effect: reads, facts: [Name, Target date] }
    contexts:
      web:
        place: planner-web::goal-detail
  - text: The Product spreads each topic's study still to do across the Student's weekly availability before the target date, around sessions already scheduled for other goals
    kind: product
    actor: student
    entities:
      - { entity: goal, effect: reads, facts: [Target date] }
      - { entity: topic, effect: reads, facts: [Estimated hours] }
      - { entity: study-session, effect: reads, facts: [Start, Planned minutes, Logged minutes] }
      - { entity: student, effect: reads, facts: [Weekly availability] }
    contexts:
      web:
        place: planner-web::goal-detail
  - text: The Product keeps the plan with the sessions it would schedule, the upcoming sessions they replace and an explanation
    kind: product
    actor: student
    entities:
      - { entity: study-plan, effect: creates, to: Proposed, facts: [Proposed sessions, Replaced sessions, Explanation, Prepared by, Prepared at] }
    contexts:
      web:
        place: planner-web::goal-detail
  - text: The Product opens the plan for review
    kind: product
    actor: student
    entities:
      - { entity: study-plan, effect: reads, facts: [Proposed sessions, Replaced sessions, Explanation] }
    contexts:
      web:
        place: planner-web::plan-review
---

# Build a plan for a goal

## Trigger

The Student has a goal with topics and a target date still ahead, and wants a schedule for it.

## Outcome

A proposed plan for the goal is open for review, with its sessions, the sessions it would replace and its explanation; the schedule has not changed.

## Edge cases

- A plan for the goal is already waiting for review → the new plan waits beside it; whichever the Student accepts first outdates the other.
