---
kind: edge
result: not-achieved
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Owner defines a habit due only on weekdays that do not include today
    kind: actor
    actor: owner
    capability: create-habit
    entities:
      - { entity: habit, effect: creates, to: Active, facts: [Name, Schedule, Started on] }
    contexts: { web: { place: tracker-web::new-habit }, mobile: { place: tracker-mobile::new-habit } }
  - text: The Product returns the Owner to Today, which does not list the new habit
    kind: product
    actor: owner
    capability: create-habit
    entities:
      - { entity: habit, effect: reads, facts: [Schedule] }
    contexts: { web: { place: tracker-web::today }, mobile: { place: tracker-mobile::today } }
  - text: The new habit waits for its first due day, with nothing to check off today
    kind: condition
    actor: owner
    entities:
      - { entity: habit, effect: reads, facts: [Schedule] }
---

# Start a habit not due today

## Trigger

The Owner starts a habit whose first scheduled day is still to come.

## Outcome

The Journey goal is not achieved today: the habit exists and is active, but
there is no first check-in until Today lists it on its first due day.
