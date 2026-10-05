---
kind: validation
routes:
  web: Web
steps:
  - text: The Student picks a goal that has not been broken down yet and asks for a plan
    kind: actor
    actor: student
    entities:
      - { entity: goal, effect: reads, facts: [Name] }
    contexts:
      web:
        place: planner-web::plans
  - text: The goal has no topics to divide into sessions
    kind: condition
    entities:
      - { entity: goal, effect: reads, facts: [] }
      - { entity: topic, effect: reads, facts: [] }
    contexts:
      web:
        place: planner-web::plans
  - text: The Product explains that the goal needs at least one topic before it can be planned
    kind: product
    actor: student
    entities:
      - { entity: goal, effect: reads, facts: [] }
      - { entity: topic, effect: reads, facts: [] }
    contexts:
      web:
        place: planner-web::plans
---

# Refuse a plan for a goal without topics

## Trigger

The Student asks for a plan for a goal that has not been broken into topics.

## Outcome

No plan is prepared, the Planning assistant does nothing, and the Student knows to add topics first.
