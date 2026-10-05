---
kind: primary
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Owner resumes a paused habit
    kind: actor
    actor: owner
    entities:
      - { entity: habit, effect: reads, facts: [Name] }
    contexts: { web: { place: tracker-web::habit-detail }, mobile: { place: tracker-mobile::habit-detail } }
  - text: The Product makes the habit active again on its schedule
    kind: product
    actor: owner
    entities:
      - { entity: habit, from: Paused, to: Active, facts: [] }
    contexts: { web: { place: tracker-web::habit-detail }, mobile: { place: tracker-mobile::habit-detail } }
  - text: Today lists the habit again from its next due day, with its streak carrying on from before the pause
    kind: condition
    actor: owner
    entities:
      - { entity: habit, effect: reads, facts: [Schedule, Current streak] }
    contexts: { web: { place: tracker-web::today }, mobile: { place: tracker-mobile::today } }
---

# Resume a paused habit

## Trigger

The Owner is ready to pick a paused habit up again.

## Outcome

The habit is active on the schedule it had, and the streak it had when it was
paused carries on.
