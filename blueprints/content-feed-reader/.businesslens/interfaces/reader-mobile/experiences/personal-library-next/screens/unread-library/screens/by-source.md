---
entities:
  - { entity: source, facts: [Name] }
  - { entity: item, facts: [Title, Published at] }
capabilities:
  - track-reading-state
---

# By source

Presents the unread backlog grouped under the source each item came from, with
how many unread items each source holds, and lets the Reader mark one source's
items read together.
