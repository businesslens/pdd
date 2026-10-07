---
kind: primary
routes:
  web: Web
steps:
  - text: The Student chooses to delete the goal
    kind: actor
    actor: student
    entities:
      - { entity: goal, effect: reads, facts: [Name] }
    contexts:
      web:
        place: planner-web::goal-detail
  - text: The Product asks the Student to confirm, and says how many topics and sessions, logged ones included, go with it for good
    kind: product
    actor: student
    entities:
      - { entity: topic, effect: reads, facts: [] }
      - { entity: study-session, as: logged, effect: reads, facts: [Logged minutes] }
    contexts:
      web:
        place: planner-web::goal-detail
  - text: The Student confirms
    kind: actor
    actor: student
    entities: []
    contexts:
      web:
        place: planner-web::goal-detail
  - text: The Product deletes the goal with its topics, sessions and plans for good, and returns to the goals
    kind: product
    actor: student
    entities:
      - { entity: goal, effect: removes }
      - { entity: topic, effect: removes, with: goal }
      - { entity: study-session, as: planned, effect: removes, from: Planned, with: topic }
      - { entity: study-session, as: logged, effect: removes, from: Logged, with: topic }
      - { entity: study-plan, as: proposed, effect: removes, from: Proposed, with: goal }
      - { entity: study-plan, as: accepted, effect: removes, from: Accepted, with: goal }
      - { entity: study-plan, as: dismissed, effect: removes, from: Dismissed, with: goal }
      - { entity: study-plan, as: outdated, effect: removes, from: Outdated, with: goal }
    contexts:
      web:
        place: planner-web::goals
---

# Delete a goal

## Trigger

The Student no longer studies toward a goal, or created it by mistake.

## Outcome

The goal, its topics, its sessions and its plans are gone for good, and the goals list no longer shows it.

## Edge cases

- The Student does not confirm → the goal and everything under it stay as they were.
