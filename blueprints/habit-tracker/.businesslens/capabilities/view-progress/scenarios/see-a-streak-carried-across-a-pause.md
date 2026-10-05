---
kind: edge
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Owner opens a habit that was paused for a while and has been resumed
    kind: actor
    actor: owner
    entities:
      - { entity: habit, effect: reads, facts: [Name, Current streak] }
    contexts: { web: { place: tracker-web::habits }, mobile: { place: tracker-mobile::habits } }
  - text: The Product presents a current streak that joins the scheduled days before and after the pause
    kind: product
    actor: owner
    entities:
      - { entity: habit, effect: reads, facts: [Current streak, Best streak] }
    contexts: { web: { place: tracker-web::habit-detail }, mobile: { place: tracker-mobile::habit-detail } }
  - text: The history marks the paused days as paused, not as missed
    kind: condition
    actor: owner
    entities:
      - { entity: check-in, effect: reads, facts: [Day] }
    contexts: { web: { place: tracker-web::habit-detail }, mobile: { place: tracker-mobile::habit-detail } }
---

# See a streak carried across a pause

## Trigger

The Owner looks at a habit they paused and later resumed.

## Outcome

The streak counts straight through the pause, and the paused days read as a
break rather than as misses.
