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
  - text: The Product asks a language model to summarize the week, and records the weekly reflection with its consistency and summary
    kind: product
    entities:
      - { entity: weekly-reflection, effect: creates, facts: [Week, Consistency, Summary] }
  - text: Every active habit kept to its schedule, so no adjustment is proposed
    kind: condition
    entities:
      - { entity: habit, effect: reads, facts: [Schedule] }
  - text: The weekly reflection presents the week with nothing to answer
    kind: condition
    entities:
      - { entity: weekly-reflection, effect: reads, facts: [Week, Consistency, Summary] }
    contexts: { web: { place: tracker-web::weekly-reflection } }
---

# Generate a reflection with nothing to suggest

## Trigger

A week ends in which every active habit kept to its schedule.

## Outcome

The weekly reflection reads the week back and proposes no change.
