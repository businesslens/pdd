---
kind: primary
result: achieved
routes:
  web: Web
steps:
  - text: The Owner opens the weekly reflection and reads its suggested adjustment
    kind: actor
    actor: owner
    capability: accept-suggested-adjustment
    entities:
      - { entity: weekly-reflection, effect: reads, facts: [Week, Consistency, Summary] }
      - { entity: suggested-adjustment, effect: reads, facts: [Proposed schedule, Reason] }
    contexts: { web: { place: tracker-web::weekly-reflection } }
  - text: The Owner accepts the suggested adjustment, and the habit takes the proposed schedule from today
    kind: actor
    actor: owner
    capability: accept-suggested-adjustment
    entities:
      - { entity: suggested-adjustment, from: Proposed, to: Accepted, facts: [] }
      - { entity: habit, facts: [Schedule] }
    contexts: { web: { place: tracker-web::weekly-reflection } }
  - text: The Product opens the habit with its new schedule and its streak
    kind: product
    actor: owner
    capability: view-progress
    entities:
      - { entity: habit, effect: reads, facts: [Name, Schedule, Current streak] }
    contexts: { web: { place: tracker-web::habit-detail } }
---

# Accept and see the new schedule

## Trigger

The Owner reads a weekly reflection that suggests a schedule they agree with.

## Outcome

The Journey goal is achieved: the habit follows the accepted schedule from
today, and the Owner sees it on the habit with its streak intact.
