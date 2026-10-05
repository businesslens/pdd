---
kind: primary
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
  - text: The Product proposes a suggested adjustment for the one habit whose schedule the week fell furthest short of
    kind: product
    entities:
      - { entity: habit, effect: reads, facts: [Schedule] }
      - { entity: suggested-adjustment, effect: creates, to: Proposed, facts: [Proposed schedule, Reason] }
  - text: The new weekly reflection waits among the reflections, and no habit has changed
    kind: condition
    entities:
      - { entity: weekly-reflection, effect: reads, facts: [Week] }
      - { entity: habit, effect: reads, facts: [] }
    contexts: { web: { place: tracker-web::reflections } }
---

# Generate a weekly reflection

## Trigger

A week ends for an Owner who has turned reflections on, with no
Owner present.

## Outcome

A weekly reflection for that week waits for the Owner, with how consistently
each active habit was done, a short summary, and one suggested adjustment.
Every habit is exactly as the Owner left it.

## Edge cases

- No active habit had a scheduled day that week → no reflection is prepared for it.
