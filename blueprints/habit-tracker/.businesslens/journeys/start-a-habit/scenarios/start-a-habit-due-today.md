---
kind: primary
result: achieved
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Owner defines a habit with a name and a schedule that makes it due today
    kind: actor
    actor: owner
    capability: create-habit
    entities:
      - { entity: habit, effect: creates, to: Active, facts: [Name, Schedule, Started on] }
    contexts: { web: { place: tracker-web::new-habit }, mobile: { place: tracker-mobile::new-habit } }
  - text: The Product returns the Owner to Today, where the new habit is listed as due
    kind: product
    actor: owner
    capability: check-off-habit
    entities:
      - { entity: habit, effect: reads, facts: [Name, Schedule, Current streak] }
    contexts: { web: { place: tracker-web::today }, mobile: { place: tracker-mobile::today } }
  - text: The Owner does it and checks the habit off
    kind: actor
    actor: owner
    capability: check-off-habit
    entities:
      - { entity: habit, effect: reads, facts: [Name] }
      - { entity: check-in, effect: creates, facts: [Day] }
    contexts: { web: { place: tracker-web::today }, mobile: { place: tracker-mobile::today } }
  - text: The habit's current streak begins at one day
    kind: condition
    actor: owner
    capability: check-off-habit
    entities:
      - { entity: habit, effect: reads, facts: [Current streak] }
    contexts: { web: { place: tracker-web::today }, mobile: { place: tracker-mobile::today } }
---

# Start a habit due today

## Trigger

The Owner decides to start a habit and do it today.

## Outcome

The Journey goal is achieved: the new habit is active with its first check-in,
and its streak has begun.
