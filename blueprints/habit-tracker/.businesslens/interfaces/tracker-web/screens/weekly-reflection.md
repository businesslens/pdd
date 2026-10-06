---
entities:
  - { entity: weekly-reflection, shows: [Week, Consistency, Summary] }
  - { entity: suggested-adjustment, shows: [Proposed schedule, Reason] }
  - { entity: habit, shows: [Name, Schedule] }
entryPoints:
  - tracker-web: /reflections/:week
---

# Weekly reflection

One week read back: how consistently each active habit was done, the written
summary when there is one, and the schedule adjustment it suggests, if any,
beside the habit's current schedule. Here the Owner accepts or dismisses the
suggestion.
