---
kind: validation
routes:
  web: Web
steps:
  - text: The Student asks the planner to plan a goal that has no topics yet
    kind: actor
    actor: student
    entities:
      - { entity: topic, effect: reads, facts: [] }
      - { entity: goal, effect: reads, facts: [Name] }
    contexts:
      web:
        place: planner-web::goal-detail
  - text: The goal has no topic with an estimate
    kind: condition
    actor: student
    entities:
      - { entity: goal, effect: reads, facts: [] }
      - { entity: topic, effect: reads, facts: [] }
    contexts:
      web:
        place: planner-web::goal-detail
  - text: The Product explains that a plan needs at least one topic to divide, and keeps no plan
    kind: product
    actor: student
    entities:
      - { entity: topic, effect: reads, facts: [] }
      - { entity: goal, effect: reads, facts: [] }
    contexts:
      web:
        place: planner-web::goal-detail
---

# Refuse a plan for a goal without topics

## Trigger

The Student asks for a plan before breaking the goal into topics.

## Outcome

No plan is kept, the schedule is unchanged, and the Student knows to add topics first.

## Edge cases

- The goal's target date has passed → the Product refuses the same way and says the goal is past.
