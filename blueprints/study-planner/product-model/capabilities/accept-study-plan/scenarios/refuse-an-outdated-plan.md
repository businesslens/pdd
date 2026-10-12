---
kind: edge
routes:
  web: Web
steps:
  - text: The Student accepts a plan after the goal changed
    kind: actor
    actor: student
    entities:
      - { entity: study-plan, effect: reads, facts: [Prepared at] }
      - { entity: goal, effect: reads, facts: [] }
    contexts:
      web:
        place: planner-web::plan-review
  - text: After the plan was prepared, a session of the goal was scheduled, moved, cancelled or logged, the goal's target date moved before a proposed session, or a proposed session's topic was removed
    kind: condition
    actor: student
    entities:
      - { entity: study-session, effect: reads, facts: [] }
      - { entity: study-plan, effect: reads, facts: [Prepared at, Proposed sessions] }
      - { entity: goal, effect: reads, facts: [Target date] }
      - { entity: topic, effect: reads, facts: [] }
    contexts:
      web:
        place: planner-web::plan-review
  - text: The Product refuses the plan, closes it as outdated and explains that it no longer matches the goal
    kind: product
    actor: student
    entities:
      - { entity: study-plan, from: Proposed, to: Outdated, facts: [] }
      - { entity: goal, effect: reads, facts: [] }
    contexts:
      web:
        place: planner-web::plan-review
  - text: The schedule is unchanged, and the Student can ask for a new plan for the goal
    kind: condition
    actor: student
    entities:
      - { entity: goal, effect: reads, facts: [] }
      - { entity: study-session, effect: reads, facts: [] }
    contexts:
      web:
        place: planner-web::plan-review
---

# Refuse an outdated plan

## Trigger

The Student accepts a plan after changing the goal's schedule, target date or topics since the plan was prepared.

## Outcome

No session changes, the plan is outdated, and the Student knows to ask for a plan that matches the goal.
