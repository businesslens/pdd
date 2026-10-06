---
kind: edge
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Owner chooses to delete a habit that has had suggestions
    kind: actor
    actor: owner
    entities:
      - { entity: habit, effect: reads, facts: [Name] }
    contexts: { web: { place: tracker-web::habit-detail }, mobile: { place: tracker-mobile::habit-detail } }
  - text: The Product asks the Owner to confirm, says the habit's check-ins and suggestions will be lost, and offers to pause it instead
    kind: product
    actor: owner
    entities:
      - { entity: habit, effect: reads, facts: [] }
      - { entity: check-in, effect: reads, facts: [] }
    contexts: { web: { place: tracker-web::habit-detail }, mobile: { place: tracker-mobile::habit-detail } }
  - text: The Owner confirms the deletion, and the habit's suggested adjustments go with it, whether waiting or already answered
    kind: actor
    actor: owner
    entities:
      - { entity: habit, effect: removes, from: Active }
      - { entity: check-in, effect: removes }
      - { entity: suggested-adjustment, as: waiting, effect: removes, from: Proposed }
      - { entity: suggested-adjustment, as: accepted, effect: removes, from: Accepted }
      - { entity: suggested-adjustment, as: dismissed, effect: removes, from: Dismissed }
      - { entity: suggested-adjustment, as: outdated, effect: removes, from: Outdated }
    contexts: { web: { place: tracker-web::habit-detail }, mobile: { place: tracker-mobile::habit-detail } }
  - text: Nothing of it remains in the list of habits
    kind: condition
    actor: owner
    entities:
      - { entity: habit, effect: reads, facts: [] }
    contexts: { web: { place: tracker-web::habits }, mobile: { place: tracker-mobile::habits } }
---

# Delete a habit with suggested adjustments

## Trigger

The Owner deletes a habit that weekly reflections have suggested schedule
changes for.

## Outcome

The habit, its check-ins and every suggested adjustment for it are gone for
good. The weekly reflections that suggested them keep their figures and summary
and offer nothing to accept or dismiss.
