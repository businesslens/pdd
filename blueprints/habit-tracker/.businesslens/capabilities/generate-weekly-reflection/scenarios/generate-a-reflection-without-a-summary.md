---
kind: edge
routes:
  web: Web
steps:
  - text: The week ends for an Owner who has reflections on
    kind: condition
    unattended: true
    entities:
      - { entity: owner, effect: reads, facts: [Reflections] }
  - text: The Product reads back the week's check-ins for each active habit
    kind: product
    entities:
      - { entity: habit, effect: reads, facts: [Schedule] }
      - { entity: check-in, effect: reads, facts: [Day] }
  - text: The language model cannot be reached or returns nothing usable
    kind: condition
    entities: []
  - text: The Product records the weekly reflection with its consistency and no summary
    kind: product
    entities:
      - { entity: weekly-reflection, effect: creates, facts: [Week, Consistency] }
  - text: The weekly reflection presents the consistency alone, with no suggested adjustment
    kind: condition
    entities:
      - { entity: weekly-reflection, effect: reads, facts: [Week, Consistency] }
      - { entity: suggested-adjustment, effect: reads, facts: [] }
    contexts: { web: { place: tracker-web::weekly-reflection } }
---

# Generate a reflection without a summary

## Trigger

A week ends while the language model the Product queries is unavailable.

## Outcome

The Owner still gets the week's consistency figures, without a summary or a
suggested adjustment, and nothing waits on the language model.
