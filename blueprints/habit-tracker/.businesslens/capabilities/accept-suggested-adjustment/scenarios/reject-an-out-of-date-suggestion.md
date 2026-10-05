---
kind: edge
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
  - text: The Owner accepts the suggested adjustment
    kind: actor
    actor: owner
    entities:
      - { entity: suggested-adjustment, effect: reads, facts: [Proposed schedule] }
    contexts: { web: { place: tracker-web::weekly-reflection } }
  - text: The habit's schedule was changed, or the habit was paused, after the suggestion was made
    kind: condition
    actor: owner
    entities:
      - { entity: habit, effect: reads, facts: [Schedule] }
    contexts: { web: { place: tracker-web::weekly-reflection } }
  - text: The Product explains that the suggested adjustment no longer fits the habit, and expires it
    kind: product
    actor: owner
    entities:
      - { entity: suggested-adjustment, from: Proposed, to: Expired, facts: [] }
      - { entity: habit, effect: reads, facts: [] }
    contexts: { web: { place: tracker-web::weekly-reflection } }
  - text: The habit keeps the schedule and state the Owner gave it
    kind: condition
    actor: owner
    entities:
      - { entity: habit, effect: reads, facts: [Schedule] }
    contexts: { web: { place: tracker-web::weekly-reflection } }
---

# Reject an out-of-date suggestion

## Trigger

The Owner accepts a suggestion for a habit they have changed or paused since
the reflection was prepared.

## Outcome

Nothing about the habit changes, the Owner knows why, and the suggestion reads
as expired.

## Edge cases

- The habit was deleted since → the weekly reflection shows the suggestion as expired and offers nothing to accept.
