---
entities:
  - { entity: maintenance, shows: [Title, Starts at, Ends at], collects: [Title, Description, Starts at, Ends at, Affected components] }
  - { entity: component, shows: [Name] }
entryPoints:
  - status-web: /manage/maintenance
---

# Maintenance list

Presents scheduled and in-progress maintenance first, then past windows, and is
where an Operator schedules a new window.
