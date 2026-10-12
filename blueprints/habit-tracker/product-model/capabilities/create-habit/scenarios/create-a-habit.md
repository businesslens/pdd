---
kind: primary
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Owner looks over their habits and starts a new one
    kind: actor
    actor: owner
    entities:
      - { entity: habit, effect: reads, facts: [Name, Schedule] }
    contexts: { web: { place: tracker-web::habits }, mobile: { place: tracker-mobile::habits } }
  - text: The Owner gives it a name and chooses when it is due
    kind: actor
    actor: owner
    entities: []
    contexts: { web: { place: tracker-web::new-habit }, mobile: { place: tracker-mobile::new-habit } }
  - text: The Product saves the new habit, counting from today
    kind: product
    actor: owner
    entities:
      - { entity: habit, effect: creates, to: Active, facts: [Name, Schedule, Started on] }
    contexts: { web: { place: tracker-web::new-habit }, mobile: { place: tracker-mobile::new-habit } }
  - text: The Product returns the Owner to Today, which lists the new habit whenever it is due
    kind: product
    actor: owner
    entities:
      - { entity: habit, effect: reads, facts: [Name, Schedule, Current streak] }
    contexts: { web: { place: tracker-web::today }, mobile: { place: tracker-mobile::today } }
---

# Create a habit

## Trigger

The Owner wants to start keeping up something new.

## Decision points

### Schedule

When does the Owner mean to do it?

- Every day → the habit is due daily.
- On chosen weekdays → the habit is due only on those days of the week.
- A number of times each week → the habit is due on any day of the week until that many check-offs are made.

## Outcome

The Owner has a new active habit with the chosen name and schedule, counted
from today, and is back on Today, where checking it off begins.
