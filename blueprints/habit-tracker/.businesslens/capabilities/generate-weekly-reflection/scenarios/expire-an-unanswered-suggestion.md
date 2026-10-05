---
kind: edge
routes:
  web: Web
steps:
  - text: A week ends while the previous week's suggested adjustment is still unanswered
    kind: condition
    unattended: true
    entities:
      - { entity: suggested-adjustment, effect: reads, facts: [] }
  - text: The Product expires the unanswered suggested adjustment before preparing the new weekly reflection
    kind: product
    entities:
      - { entity: suggested-adjustment, from: Proposed, to: Expired, facts: [] }
      - { entity: weekly-reflection, effect: reads, facts: [] }
  - text: The earlier weekly reflection shows its suggested adjustment as expired, and the habit it concerned is unchanged
    kind: condition
    entities:
      - { entity: weekly-reflection, effect: reads, facts: [Week] }
      - { entity: suggested-adjustment, effect: reads, facts: [Proposed schedule] }
      - { entity: habit, effect: reads, facts: [Schedule] }
    contexts: { web: { place: tracker-web::weekly-reflection } }
---

# Expire an unanswered suggestion

## Trigger

A new week ends before the Owner answered the previous week's suggested
adjustment.

## Outcome

The earlier suggestion can no longer be accepted, the habit keeps the schedule
the Owner gave it, and the new reflection is prepared as usual.
