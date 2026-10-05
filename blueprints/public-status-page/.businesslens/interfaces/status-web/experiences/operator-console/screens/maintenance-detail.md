---
entities:
  - { entity: maintenance, shows: [Title, Description, Starts at, Ends at, Affected components] }
entryPoints:
  - status-web: /manage/maintenance/:maintenanceId
---

# Maintenance detail

Presents one maintenance window, where an Operator cancels it before it starts
or completes it early once it is under way.
