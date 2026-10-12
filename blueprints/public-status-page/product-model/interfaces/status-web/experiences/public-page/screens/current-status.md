---
entities:
  - { entity: component, shows: [Name, Description, Status] }
  - { entity: incident, shows: [Title, Impact] }
  - { entity: incident-update, shows: [Message, Posted at] }
  - { entity: maintenance, shows: [Title, Starts at, Ends at] }
entryPoints:
  - status-web: /
---

# Current status

Presents the overall status of the service, every component with its status,
each unresolved incident with its latest update, and maintenance that is in
progress or coming up.
