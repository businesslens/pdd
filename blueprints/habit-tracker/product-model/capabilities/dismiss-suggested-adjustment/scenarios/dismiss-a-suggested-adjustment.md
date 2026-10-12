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
  - text: The Owner dismisses the suggested adjustment
    kind: actor
    actor: owner
    entities:
      - { entity: suggested-adjustment, effect: reads, facts: [Proposed schedule] }
    contexts: { web: { place: tracker-web::weekly-reflection } }
  - text: The Product records that the Owner dismissed it
    kind: product
    actor: owner
    entities:
      - { entity: suggested-adjustment, from: Proposed, to: Dismissed, facts: [] }
    contexts: { web: { place: tracker-web::weekly-reflection } }
  - text: The habit keeps its schedule
    kind: condition
    actor: owner
    entities:
      - { entity: habit, effect: reads, facts: [Schedule] }
    contexts: { web: { place: tracker-web::weekly-reflection } }
---

# Dismiss a suggested adjustment

## Trigger

The Owner does not want the change a weekly reflection suggests.

## Outcome

The habit is unchanged and the suggestion reads as dismissed.

## Edge cases

- The suggestion no longer fits the habit → it is dismissed all the same, and the habit is unchanged.
