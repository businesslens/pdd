---
kind: edge
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Owner opens a habit kept a number of times each week
    kind: actor
    actor: owner
    entities:
      - { entity: habit, effect: reads, facts: [Name, Schedule, Current streak] }
    contexts: { web: { place: tracker-web::habits }, mobile: { place: tracker-mobile::habits } }
  - text: The Product presents its streak in weeks whose target was met, and how far this week has come toward the target
    kind: product
    actor: owner
    entities:
      - { entity: habit, effect: reads, facts: [Schedule, Current streak, Best streak] }
      - { entity: check-in, effect: reads, facts: [Day] }
    contexts: { web: { place: tracker-web::habit-detail }, mobile: { place: tracker-mobile::habit-detail } }
  - text: The week in progress does not break the streak before it ends
    kind: condition
    actor: owner
    entities:
      - { entity: habit, effect: reads, facts: [Current streak] }
    contexts: { web: { place: tracker-web::habit-detail }, mobile: { place: tracker-mobile::habit-detail } }
---

# See a weekly target streak

## Trigger

The Owner looks at a habit they mean to do a number of times each week.

## Outcome

The streak is counted in weeks, and an unfinished week only counts against it
once the week is over.
