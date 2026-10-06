---
kind: edge
result: not-achieved
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
  - text: The Owner accepts a suggested adjustment for a habit they have changed since
    kind: actor
    actor: owner
    capability: accept-suggested-adjustment
    entities:
      - { entity: suggested-adjustment, effect: reads, facts: [Proposed schedule] }
      - { entity: habit, effect: reads, facts: [Schedule] }
    contexts: { web: { place: tracker-web::weekly-reflection } }
  - text: The Product explains that the suggestion no longer fits, and marks the suggested adjustment outdated
    kind: product
    actor: owner
    capability: accept-suggested-adjustment
    entities:
      - { entity: suggested-adjustment, from: Proposed, to: Outdated, facts: [] }
    contexts: { web: { place: tracker-web::weekly-reflection } }
---

# Accept a suggestion that no longer fits

## Trigger

The Owner accepts a suggestion for a habit whose schedule they already changed
after the reflection was prepared.

## Outcome

The Journey goal is not achieved: the habit keeps the schedule the Owner gave
it, and the suggestion reads as outdated.
