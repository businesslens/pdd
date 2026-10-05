---
kind: primary
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Owner chooses to delete a habit
    kind: actor
    actor: owner
    entities:
      - { entity: habit, effect: reads, facts: [Name] }
    contexts: { web: { place: tracker-web::habit-detail }, mobile: { place: tracker-mobile::habit-detail } }
  - text: The Product asks the Owner to confirm, says the habit's check-ins will be lost, and offers to pause it instead
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
      - { entity: habit, effect: removes, from: Active }
      - { entity: check-in, effect: removes }
    contexts: { web: { place: tracker-web::habit-detail }, mobile: { place: tracker-mobile::habit-detail } }
  - text: Nothing of it remains on Today or in the list of habits
    kind: condition
    actor: owner
    entities:
      - { entity: habit, effect: reads, facts: [] }
    contexts: { web: { place: tracker-web::habits }, mobile: { place: tracker-mobile::habits } }
---

# Delete a habit

## Trigger

The Owner no longer wants to keep a habit at all.

## Outcome

The habit and all of its check-ins are gone, and no streak or history of it
remains.

## Edge cases

- The Owner declines to confirm → the habit and its history stay as they were.
- The Owner pauses instead → the habit is paused with its history kept.
- The habit is paused → it is deleted the same way.
