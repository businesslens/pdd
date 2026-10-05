---
entities:
  - { entity: incident, shows: [Title, Impact, Affected components, Started at, Resolved at] }
  - { entity: incident-update, shows: [Message, Incident status, Posted at] }
entryPoints:
  - status-web: /incidents/:incidentId
---

# Incident detail

Presents one incident: what it affects, when it started and, once resolved,
when it ended, with every posted update on its timeline, newest first.
