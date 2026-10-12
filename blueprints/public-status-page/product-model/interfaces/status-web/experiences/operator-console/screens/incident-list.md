---
entities:
  - { entity: incident, shows: [Title, Impact, Started at, Resolved at] }
entryPoints:
  - status-web: /manage/incidents
---

# Incident list

Presents unresolved incidents first, then resolved ones, each with its impact
and when it started and ended.
