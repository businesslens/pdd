---
kind: validation
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
  - text: The Owner gives it a name and chooses specific weekdays without picking a day
    kind: actor
    actor: owner
    entities: []
    contexts: { web: { place: tracker-web::new-habit }, mobile: { place: tracker-mobile::new-habit } }
  - text: The Product explains that at least one day must be chosen
    kind: product
    actor: owner
    entities: []
    contexts: { web: { place: tracker-web::new-habit }, mobile: { place: tracker-mobile::new-habit } }
  - text: Nothing is saved, and the name and choices stay as the Owner entered them
    kind: condition
    actor: owner
    entities: []
    contexts: { web: { place: tracker-web::new-habit }, mobile: { place: tracker-mobile::new-habit } }
---

# Reject a schedule with no days

## Trigger

The Owner tries to save a new habit due on chosen weekdays without choosing any.

## Outcome

No habit is created, and the Owner can pick a day or another schedule without
entering anything again.

## Edge cases

- A number of times each week below one or above seven → the Product refuses it the same way.
- No name → the Product asks for one and keeps the chosen schedule.
