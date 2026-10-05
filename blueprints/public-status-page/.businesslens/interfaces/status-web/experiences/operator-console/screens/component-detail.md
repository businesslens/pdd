---
entities:
  - { entity: component, shows: [Name, Description, Status], collects: [Name, Description] }
entryPoints:
  - status-web: /manage/components/:componentId
---

# Component detail

Presents one component's name, description and current status, where an
Operator edits how it is described to visitors.
