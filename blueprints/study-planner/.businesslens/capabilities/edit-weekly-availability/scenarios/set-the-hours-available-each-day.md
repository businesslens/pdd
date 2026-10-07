---
kind: primary
routes:
  web: Web
steps:
  - text: The Student changes the hours they can study on each day of the week
    kind: actor
    actor: student
    entities:
      - { entity: student, effect: reads, facts: [Weekly availability] }
    contexts:
      web:
        place: planner-web::plans
  - text: The Product saves the weekly availability
    kind: product
    actor: student
    entities:
      - { entity: student, facts: [Weekly availability] }
    contexts:
      web:
        place: planner-web::plans
  - text: Sessions already scheduled stay where they are
    kind: condition
    actor: student
    entities:
      - { entity: study-session, effect: reads, facts: [] }
    contexts:
      web:
        place: planner-web::plans
---

# Set the hours available each day

## Trigger

The Student wants their plans built around the time they really have.

## Outcome

The next study plan is built around the new hours, and nothing already scheduled has moved.

## Edge cases

- The new hours leave a scheduled session outside the availability → the session stays; only plans prepared afterwards follow the new hours.
