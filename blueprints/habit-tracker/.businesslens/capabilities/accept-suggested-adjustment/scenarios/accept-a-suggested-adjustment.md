---
kind: primary
routes:
  web: Web
steps:
  - text: The Owner opens a weekly reflection with a suggested adjustment
    kind: actor
    actor: owner
    entities:
      - { entity: weekly-reflection, effect: reads, facts: [Week, Consistency, Summary] }
      - { entity: suggested-adjustment, effect: reads, facts: [Proposed schedule, Reason] }
    contexts: { web: { place: tracker-web::weekly-reflection } }
  - text: The Owner compares the proposed schedule with the habit's current one and accepts the suggested adjustment
    kind: actor
    actor: owner
    entities:
      - { entity: habit, effect: reads, facts: [Name, Schedule] }
      - { entity: suggested-adjustment, effect: reads, facts: [Proposed schedule] }
    contexts: { web: { place: tracker-web::weekly-reflection } }
  - text: The Product gives the habit the proposed schedule, due from today
    kind: product
    actor: owner
    entities:
      - { entity: habit, facts: [Schedule] }
      - { entity: suggested-adjustment, from: Proposed, to: Accepted, facts: [] }
    contexts: { web: { place: tracker-web::weekly-reflection } }
  - text: The Product opens the habit, which follows the new schedule with its earlier days still counted against the schedule they had
    kind: product
    actor: owner
    entities:
      - { entity: habit, effect: reads, facts: [Name, Schedule, Current streak] }
    contexts: { web: { place: tracker-web::habit-detail } }
---

# Accept a suggested adjustment

## Trigger

The Owner agrees with a weekly reflection's suggestion for one of their habits.

## Outcome

The habit follows the proposed schedule from today, its history and streak are
kept, the suggestion reads as accepted, and the Owner is shown the habit.
