---
entities:
  - { entity: incident, shows: [Title, Impact, Affected components, Started at, Resolved at] }
  - { entity: incident-update, shows: [Message, Notes, Incident status, Posted at], collects: [Message, Notes, Incident status] }
  - { entity: component, shows: [Name, Status] }
entryPoints:
  - status-web: /manage/incidents/:incidentId
---

# Incident workspace

Presents one incident to the operators: its timeline of posted updates, the
update being written, and the notes a draft is prepared from. This is where
an Operator asks for a draft, edits it, and posts updates until the incident
is resolved.
