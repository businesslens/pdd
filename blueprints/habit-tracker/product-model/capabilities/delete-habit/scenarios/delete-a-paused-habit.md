---
kind: edge
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Owner chooses to delete a paused habit
    kind: actor
    actor: owner
    entities:
      - { entity: habit, effect: reads, facts: [Name] }
    contexts: { web: { place: tracker-web::habit-detail }, mobile: { place: tracker-mobile::habit-detail } }
  - text: The Product asks the Owner to confirm and says the habit's check-ins will be lost
    kind: product
    actor: owner
    entities:
      - { entity: habit, effect: reads, facts: [] }
      - { entity: check-in, effect: reads, facts: [] }
    contexts: { web: { place: tracker-web::habit-detail }, mobile: { place: tracker-mobile::habit-detail } }
  - text: The Owner confirms the deletion
    kind: actor
    actor: owner
    entities:
      - { entity: habit, effect: removes, from: Paused }
      - { entity: check-in, effect: removes, with: habit }
    contexts: { web: { place: tracker-web::habit-detail }, mobile: { place: tracker-mobile::habit-detail } }
  - text: Nothing of it remains in the list of habits
    kind: condition
    actor: owner
    entities:
      - { entity: habit, effect: reads, facts: [] }
    contexts: { web: { place: tracker-web::habits }, mobile: { place: tracker-mobile::habits } }
---

# Delete a paused habit

## Trigger

The Owner paused a habit and decides not to come back to it.

## Outcome

The habit and all of its check-ins are gone for good, and no streak or history
of it remains.
