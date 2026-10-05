---
entities:
  - { entity: incident, collects: [Title, Impact, Affected components] }
  - { entity: incident-update, collects: [Message] }
  - { entity: component, shows: [Name, Status], collects: [Status] }
entryPoints:
  - status-web: /manage/incidents/new
---

# New incident

Where an Operator declares an incident: its title and impact, the components
it affects and the status each should show, and the first message visitors
will read.
