---
kind: primary
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Owner checks off a habit due today
    kind: actor
    actor: owner
    entities:
      - { entity: habit, effect: reads, facts: [Name] }
    contexts: { web: { place: tracker-web::today }, mobile: { place: tracker-mobile::today } }
  - text: The Product records a check-in for today
    kind: product
    actor: owner
    entities:
      - { entity: check-in, effect: creates, facts: [Day] }
    contexts: { web: { place: tracker-web::today }, mobile: { place: tracker-mobile::today } }
  - text: The habit shows as done today, and its current streak includes today
    kind: condition
    actor: owner
    entities:
      - { entity: habit, effect: reads, facts: [Current streak] }
    contexts: { web: { place: tracker-web::today }, mobile: { place: tracker-mobile::today } }
---

# Check off a habit due today

## Trigger

The Owner has done a habit that is due today.

## Outcome

Today's check-in is recorded, the habit is done for today, and its current
streak counts today.

## Edge cases

- A habit kept a number of times each week → the check-in counts toward this week's target, and the habit leaves Today once the target is met.
