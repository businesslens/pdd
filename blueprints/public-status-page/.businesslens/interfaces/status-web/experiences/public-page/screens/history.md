---
entities:
  - { entity: incident, shows: [Title, Impact, Started at, Resolved at] }
  - { entity: maintenance, shows: [Title, Starts at, Ends at] }
entryPoints:
  - status-web: /history
---

# History

Presents the page's past: resolved incidents and completed maintenance,
newest first, each opening to its full record.
