---
kind: primary
routes:
  web: Web
steps:
  - text: The Student enters a name and a target date
    kind: actor
    actor: student
    entities: []
    contexts:
      web:
        place: planner-web::goals
  - text: The Product creates the goal
    kind: product
    actor: student
    entities:
      - { entity: goal, effect: creates, facts: [Name, Target date] }
    contexts:
      web:
        place: planner-web::goals
  - text: The Product opens the new goal, ready to be broken into topics
    kind: product
    actor: student
    entities:
      - { entity: goal, effect: reads, facts: [Name, Target date] }
      - { entity: topic, effect: reads, facts: [] }
    contexts:
      web:
        place: planner-web::goal-detail
---

# Create a goal

## Trigger

The Student has something to study for by a date, such as an exam.

## Outcome

The goal exists with its name and target date, and its page is open with no topics yet.
