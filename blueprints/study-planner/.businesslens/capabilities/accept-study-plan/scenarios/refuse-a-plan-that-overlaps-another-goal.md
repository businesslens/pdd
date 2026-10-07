---
kind: edge
routes:
  web: Web
steps:
  - text: The Student accepts a plan after scheduling or moving a session of another goal
    kind: actor
    actor: student
    entities:
      - { entity: study-plan, effect: reads, facts: [Prepared at] }
      - { entity: goal, effect: reads, facts: [] }
    contexts:
      web:
        place: planner-web::plan-review
  - text: A proposed session now shares time with a session of another goal
    kind: condition
    actor: student
    entities:
      - { entity: study-plan, effect: reads, facts: [Proposed sessions] }
      - { entity: study-session, as: other-goal, effect: reads, facts: [Start, Planned minutes] }
      - { entity: goal, effect: reads, facts: [] }
    contexts:
      web:
        place: planner-web::plan-review
  - text: The Product refuses the plan, closes it as outdated and names the sessions it would overlap
    kind: product
    actor: student
    entities:
      - { entity: study-plan, from: Proposed, to: Outdated, facts: [] }
      - { entity: study-session, as: other-goal, effect: reads, facts: [Start] }
    contexts:
      web:
        place: planner-web::plan-review
  - text: Both goals' sessions are unchanged, and the Student can ask for a new plan around the session that now holds that time
    kind: condition
    actor: student
    entities:
      - { entity: goal, effect: reads, facts: [] }
      - { entity: study-session, as: other-goal, effect: reads, facts: [] }
    contexts:
      web:
        place: planner-web::plan-review
---

# Refuse a plan that overlaps another goal

## Trigger

The Student accepts a plan after another goal's session was put in time the plan proposes to use.

## Outcome

No session of either goal changes, the plan is outdated, and the Student knows which session now holds the time.
